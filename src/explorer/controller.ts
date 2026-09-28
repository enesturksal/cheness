import { useStore, type ExplorerState } from '../store/useStore';
import { ExplorerError, fetchExplorer } from './api';
import { cacheGet, cacheSet } from './cache';
import { explorerQueryFor } from './query';

const DEBOUNCE_MS = 250;
const RATE_LIMIT_BACKOFF_MS = 60_000;

/**
 * Keeps `store.explorer` in sync with the viewed position. Debounces rapid navigation,
 * serves from cache first, aborts superseded requests, backs off on HTTP 429 and never
 * fetches for the bot's turn unless opponent hints are enabled. Returns a disposer.
 */
export function startExplorerController(): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let inflight: AbortController | null = null;
  let rateLimitedUntil = 0;

  const store = useStore;

  const publish = (e: ExplorerState) => {
    // Only publish if the user is still looking at the same position/query.
    if (explorerQueryFor(store.getState()).key === e.key) store.getState().setExplorer(e);
  };

  const run = async () => {
    const s = store.getState();
    const { q, key, wanted } = explorerQueryFor(s);
    if (!wanted) {
      if (s.explorer.key !== key || s.explorer.status !== 'skipped') {
        s.setExplorer({ key, status: 'skipped', data: null });
      }
      return;
    }
    if (s.explorer.key === key && (s.explorer.status === 'ok' || s.explorer.status === 'empty')) {
      return;
    }

    const cached = await cacheGet(key);
    if (cached) {
      publish({ key, status: cached.moves.length ? 'ok' : 'empty', data: cached });
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      publish({ key, status: 'offline', data: null });
      return;
    }

    // The explorer API rejects anonymous requests; don't even try without a token.
    if (!s.lichessToken) {
      publish({ key, status: 'unauthorized', data: null });
      return;
    }

    const now = Date.now();
    if (rateLimitedUntil > now) {
      publish({ key, status: 'ratelimited', data: null });
      clearTimeout(retryTimer);
      retryTimer = setTimeout(schedule, rateLimitedUntil - now);
      return;
    }

    inflight?.abort();
    const ctrl = new AbortController();
    inflight = ctrl;
    publish({ key, status: 'loading', data: null });
    try {
      const data = await fetchExplorer(q, ctrl.signal, s.lichessToken);
      void cacheSet(key, data);
      publish({ key, status: data.moves.length ? 'ok' : 'empty', data });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      if (err instanceof ExplorerError && err.status === 401) {
        // Token revoked or expired: forget it; the next run reports "unauthorized".
        publish({ key, status: 'unauthorized', data: null });
        store.getState().setSettings({ lichessToken: null, lichessUser: null });
      } else if (err instanceof ExplorerError && err.status === 429) {
        rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
        publish({ key, status: 'ratelimited', data: null });
        clearTimeout(retryTimer);
        retryTimer = setTimeout(schedule, RATE_LIMIT_BACKOFF_MS);
      } else if (err instanceof TypeError || navigator.onLine === false) {
        // fetch() rejects with TypeError on network failure
        publish({ key, status: 'offline', data: null });
      } else {
        publish({ key, status: 'error', data: null });
      }
    } finally {
      if (inflight === ctrl) inflight = null;
    }
  };

  const schedule = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void run(), DEBOUNCE_MS);
  };

  const unsubscribe = store.subscribe((s, prev) => {
    if (
      s.game !== prev.game ||
      s.explorerDb !== prev.explorerDb ||
      s.ratings !== prev.ratings ||
      s.speeds !== prev.speeds ||
      s.tutorEnabled !== prev.tutorEnabled ||
      s.showOpponentHints !== prev.showOpponentHints ||
      s.takeover !== prev.takeover ||
      s.opponent !== prev.opponent ||
      s.playerColor !== prev.playerColor ||
      s.lichessToken !== prev.lichessToken
    ) {
      schedule();
    }
  });

  const onOnline = () => schedule();
  window.addEventListener('online', onOnline);
  schedule();

  return () => {
    unsubscribe();
    window.removeEventListener('online', onOnline);
    clearTimeout(debounceTimer);
    clearTimeout(retryTimer);
    inflight?.abort();
  };
}
