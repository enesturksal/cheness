import { currentFen, sanFromUci, statusOf } from '../game/game';
import { humanToMove, useStore, type Suggestion, type SuggestionState } from '../store/useStore';
import { fetchCloudEval } from './cloudEval';
import { getEngine } from './engineManager';

const DEBOUNCE_MS = 250;
const LOCAL_DEPTH = 12;
const LINES = 3;
const CACHE_CAP = 300;

const cache = new Map<string, SuggestionState>();

function remember(fen: string, s: SuggestionState): void {
  if (cache.size >= CACHE_CAP) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(fen, s);
}

/**
 * Best-move suggestions for the viewed position (arrows when the explorer has no data).
 * Lichess cloud evaluations first (deep, free), the local bot engine otherwise. The bot
 * engine is idle whenever suggestions are wanted (it is the human's turn), so the two never
 * compete. Returns a disposer.
 */
export function startSuggestionController(): () => void {
  const store = useStore;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;

  const wanted = (): boolean => {
    const s = store.getState();
    if (!s.showArrows) return false;
    return humanToMove(s) || s.showOpponentHints;
  };

  const publish = (sg: SuggestionState) => {
    if (currentFen(store.getState().game) === sg.fen) store.getState().setSuggestions(sg);
  };

  const run = async () => {
    const gen = ++generation;
    const s = store.getState();
    const fen = currentFen(s.game);
    if (!wanted()) {
      if (s.suggestions.status !== 'idle')
        s.setSuggestions({ ...s.suggestions, status: 'idle', fen: null, lines: [] });
      return;
    }
    if (s.suggestions.fen === fen && s.suggestions.status !== 'idle') return;

    const cached = cache.get(fen);
    if (cached) {
      publish(cached);
      return;
    }
    if (statusOf(fen).over) {
      publish({ fen, status: 'none', source: null, depth: 0, lines: [] });
      return;
    }

    publish({ fen, status: 'loading', source: null, depth: 0, lines: [] });

    const toSuggestions = (lines: { uci: string; score: Suggestion['score'] }[]): Suggestion[] =>
      lines
        .filter((l) => l.uci)
        .slice(0, LINES)
        .map((l) => ({ uci: l.uci, san: sanFromUci(fen, l.uci) ?? l.uci, score: l.score }));

    let result: SuggestionState | null = null;
    if (s.useCloudEval) {
      const cloud = await fetchCloudEval(fen, LINES);
      if (gen !== generation) return;
      if (cloud && cloud.lines.length) {
        result = {
          fen,
          status: 'ok',
          source: 'cloud',
          depth: cloud.depth,
          lines: toSuggestions(cloud.lines),
        };
      }
    }
    if (!result) {
      try {
        const ev = await getEngine().evaluate(fen, LOCAL_DEPTH, LINES);
        if (gen !== generation) return;
        const lines = ev.lines.map((l) => ({
          uci: l.pv[0] ?? '',
          score: { cp: l.cp, mate: l.mate },
        }));
        result = {
          fen,
          status: lines.length ? 'ok' : 'none',
          source: 'engine',
          depth: ev.depth,
          lines: toSuggestions(lines),
        };
      } catch {
        result = { fen, status: 'none', source: null, depth: 0, lines: [] };
      }
    }
    if (result.status === 'ok') remember(fen, result);
    publish(result);
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(), DEBOUNCE_MS);
  };

  const unsubscribe = store.subscribe((s, prev) => {
    if (
      s.game !== prev.game ||
      s.showArrows !== prev.showArrows ||
      s.mode !== prev.mode ||
      s.takeover !== prev.takeover ||
      s.playerColor !== prev.playerColor ||
      s.showOpponentHints !== prev.showOpponentHints ||
      s.useCloudEval !== prev.useCloudEval
    ) {
      schedule();
    }
  });
  schedule();

  return () => {
    generation++;
    unsubscribe();
    clearTimeout(timer);
  };
}
