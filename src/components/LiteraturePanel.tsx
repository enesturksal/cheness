import { useEffect, useState } from 'react';
import { movetext } from '../game/game';
import { useT } from '../i18n/useT';
import { fetchTheory, type TheoryPage } from '../literature/wikibooks';
import { useStore } from '../store/useStore';

interface State {
  key: string;
  status: 'loading' | 'ok' | 'none' | 'offline';
  page: TheoryPage | null;
}

const MAX_PARAGRAPHS = 14;

/** Human-written theory for the current line, from Wikibooks' Chess Opening Theory. */
export function LiteraturePanel() {
  const t = useT();
  const game = useStore((s) => s.game);
  const sans = game.moves.slice(0, game.ply).map((m) => m.san);
  const key = sans.join(' ');
  const [state, setState] = useState<State>({ key: '', status: 'loading', page: null });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setState((prev) => (prev.key === key ? prev : { key, status: 'loading', page: null }));
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setState({ key, status: 'offline', page: null });
        return;
      }
      fetchTheory(sans, 4, ctrl.signal)
        .then((page) => {
          if (ctrl.signal.aborted) return;
          setState({ key, status: page ? 'ok' : 'none', page });
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setState({ key, status: 'none', page: null });
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // sans is derived from key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state.key === key ? state : { key, status: 'loading' as const, page: null };
  const page = current.page;
  let shown = 0;

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
          {t('lit.title')}
        </h3>
        {page && (
          <a
            className="text-xs text-accent underline"
            href={page.url}
            target="_blank"
            rel="noreferrer"
          >
            {t('lit.open')}
          </a>
        )}
      </div>
      {current.status === 'loading' && <p className="text-xs text-muted">{t('lit.loading')}</p>}
      {current.status === 'offline' && <p className="text-xs text-muted">{t('lit.offline')}</p>}
      {current.status === 'none' && <p className="text-xs text-muted">{t('lit.none')}</p>}
      {page && page.plies < sans.length && (
        <p className="text-xs text-muted">
          {t('lit.parent')}{' '}
          <span className="font-mono">
            {movetext({ ...game, ply: page.plies }, page.plies) || '—'}
          </span>
        </p>
      )}
      {page &&
        page.sections.map((sec, i) => {
          if (!expanded && shown >= MAX_PARAGRAPHS) return null;
          return (
            <section key={i} className="space-y-1.5">
              {sec.heading && <h4 className="font-semibold">{sec.heading}</h4>}
              {sec.paragraphs.map((p, j) => {
                if (!expanded && shown >= MAX_PARAGRAPHS) return null;
                shown += 1;
                return (
                  <p key={j} className="leading-relaxed">
                    {p}
                  </p>
                );
              })}
              {sec.rows.length > 0 && (expanded || shown < MAX_PARAGRAPHS) && (
                <div className="overflow-x-auto">
                  <table className="text-xs">
                    <tbody>
                      {sec.rows.slice(0, expanded ? 40 : 8).map((r, k) => (
                        <tr key={k} className="border-t border-line">
                          {r.map((c, m) => (
                            <td key={m} className="px-1.5 py-1 align-top whitespace-nowrap">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      {page && !expanded && shown >= MAX_PARAGRAPHS && (
        <button type="button" className="btn self-start" onClick={() => setExpanded(true)}>
          +
        </button>
      )}
    </div>
  );
}
