import { useEffect, useMemo, useState } from 'react';
import { POPULAR_BLACK, POPULAR_WHITE, type PopularOpening } from '../data/popularOpenings';
import { movePercent } from '../explorer/api';
import { familyOf } from '../explorer/book';
import { fetchExplorerCached } from '../explorer/fetchCached';
import type { ExplorerResponse } from '../explorer/types';
import { epdAfter, movetextOfUciLine, START_FEN, toEpd, type Color } from '../game/game';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';

type Shares = Partial<Record<'root' | 'e2e4' | 'd2d4', ExplorerResponse>>;

function OpeningCard({ o, side, share }: { o: PopularOpening; side: Color; share: number | null }) {
  const t = useT();
  const loadGame = useStore((s) => s.loadGame);
  const openFamily = useStore((s) => s.openLibraryFamily);
  const family = familyOf(o.family);
  return (
    <div className="card flex flex-col gap-2 p-3">
      <div className="flex items-start gap-2">
        <span className="eco mt-0.5">{o.eco}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">{o.family}</h3>
          <p className="truncate font-mono text-[11px] text-muted">{movetextOfUciLine(o.line)}</p>
        </div>
        {share !== null && (
          <span className="chip shrink-0 text-muted">
            {share}% {t('openings.share')}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className="btn btn-primary px-2.5 py-1.5 text-xs"
          onClick={() => loadGame(o.line, { mode: 'bot', playerColor: side })}
        >
          {t('openings.practice')}
        </button>
        <button
          type="button"
          className="btn px-2.5 py-1.5 text-xs"
          onClick={() => loadGame(o.line, { mode: 'explore', playerColor: side })}
        >
          {t('openings.explore')}
        </button>
        {family && (
          <button
            type="button"
            className="btn px-2.5 py-1.5 text-xs"
            onClick={() => openFamily(family.name)}
          >
            {family.entries.length} {t('openings.variations')}
          </button>
        )}
      </div>
    </div>
  );
}

/** Most played openings for each side, with live Lichess shares when logged in. */
export function OpeningsPage() {
  const t = useT();
  const token = useStore((s) => s.lichessToken);
  const ratings = useStore((s) => s.ratings);
  const speeds = useStore((s) => s.speeds);
  const [side, setSide] = useState<Color>('white');
  const [shares, setShares] = useState<Shares>({});

  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();
    (async () => {
      const q = (epd: string) => ({ db: 'lichess' as const, epd, ratings, speeds });
      const root = await fetchExplorerCached(q(toEpd(START_FEN)), token, ctrl.signal);
      const e4 = await fetchExplorerCached(q(epdAfter(START_FEN, 'e2e4')!), token, ctrl.signal);
      const d4 = await fetchExplorerCached(q(epdAfter(START_FEN, 'd2d4')!), token, ctrl.signal);
      if (!ctrl.signal.aborted) {
        setShares({ root: root ?? undefined, e2e4: e4 ?? undefined, d2d4: d4 ?? undefined });
      }
    })();
    return () => ctrl.abort();
  }, [token, ratings, speeds]);

  const firstMoveShare = (uci: string): number | null => {
    const r = shares.root;
    const m = r?.moves.find((x) => x.uci === uci);
    return r && m ? Math.round(movePercent(m, r)) : null;
  };
  const replyShare = (o: PopularOpening): number | null => {
    if (!o.reply) return null;
    const r = shares[o.reply];
    const m = r?.moves.find((x) => x.uci === o.line[1]);
    return r && m ? Math.round(movePercent(m, r)) : null;
  };

  const whiteGroups = useMemo(() => {
    const groups = new Map<string, PopularOpening[]>();
    for (const o of POPULAR_WHITE) {
      const first = o.line[0];
      groups.set(first, [...(groups.get(first) ?? []), o]);
    }
    return [...groups.entries()];
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-3 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{t('home.openings')}</h2>
        <div className="seg">
          <button type="button" aria-pressed={side === 'white'} onClick={() => setSide('white')}>
            {t('openings.white')}
          </button>
          <button type="button" aria-pressed={side === 'black'} onClick={() => setSide('black')}>
            {t('openings.black')}
          </button>
        </div>
      </div>
      {!token && <p className="text-xs text-muted">{t('openings.loginHint')}</p>}

      {side === 'white' ? (
        whiteGroups.map(([first, list]) => {
          const share = firstMoveShare(first);
          return (
            <section key={first} className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted">
                1. {movetextOfUciLine([first]).replace(/^1\.\s*/, '')}
                {share !== null && <span className="chip">{share}%</span>}
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {list.map((o) => (
                  <OpeningCard key={o.family} o={o} side="white" share={null} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <>
          {(['e2e4', 'd2d4'] as const).map((reply) => (
            <section key={reply} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-muted">
                {t('openings.vs')} 1. {reply === 'e2e4' ? 'e4' : 'd4'}
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {POPULAR_BLACK.filter((o) => o.reply === reply).map((o) => (
                  <OpeningCard key={o.family} o={o} side="black" share={replyShare(o)} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
