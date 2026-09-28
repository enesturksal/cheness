import { useMemo, useState } from 'react';
import { formatCount, movePercent, outcomePercents, total } from '../explorer/api';
import {
  bookContinuations,
  lookupEpd,
  openingForLine,
  type BookContinuation,
  type BookEntry,
} from '../explorer/book';
import { startLogin } from '../explorer/lichessAuth';
import { explorerQueryFor } from '../explorer/query';
import type { ExplorerMove, OpeningName } from '../explorer/types';
import { currentFen, epdAfter, turnOf } from '../game/game';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { useLongPress } from './useLongPress';

const DEFAULT_ROWS = 5;

/** Three-colour outcome bar, Lichess style. */
export function Wdl({ white, draws, black }: { white: number; draws: number; black: number }) {
  const p = outcomePercents({ white, draws, black });
  const label = (v: number) => (v >= 12 ? `${Math.round(v)}%` : '');
  return (
    <div className="wdl" title={`${p.white}% / ${p.draws}% / ${p.black}%`}>
      <span className="w" style={{ width: `${p.white}%` }}>
        {label(p.white)}
      </span>
      <span className="d" style={{ width: `${p.draws}%` }}>
        {label(p.draws)}
      </span>
      <span className="b" style={{ width: `${p.black}%` }}>
        {label(p.black)}
      </span>
    </div>
  );
}

/** Short label for the opening a move leads to, relative to the current opening. */
function leadLabel(
  target: OpeningName | BookEntry | null,
  current: BookEntry | null,
): string | null {
  if (!target) return null;
  if (current && target.name === current.name) return null;
  const colon = target.name.indexOf(':');
  const family = colon === -1 ? target.name : target.name.slice(0, colon);
  if (current && family === current.family && colon !== -1)
    return target.name.slice(colon + 1).trim();
  return target.name;
}

interface RowProps {
  uci: string;
  san: string;
  selected: boolean;
  onTap: (uci: string) => void;
  onLongPress: (uci: string) => void;
  children: React.ReactNode;
}

function Row({ uci, san, selected, onTap, onLongPress, children }: RowProps) {
  const handlers = useLongPress(
    () => onLongPress(uci),
    () => onTap(uci),
  );
  return (
    <button
      type="button"
      {...handlers}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
        selected ? 'bg-bg3 ring-1 ring-accent' : 'hover:bg-bg3'
      }`}
    >
      <span className="w-12 shrink-0 font-semibold">{san}</span>
      {children}
    </button>
  );
}

export function OpeningPanel() {
  const t = useT();
  const game = useStore((s) => s.game);
  const explorer = useStore((s) => s.explorer);
  const tutorEnabled = useStore((s) => s.tutorEnabled);
  const explorerDb = useStore((s) => s.explorerDb);
  const previewUci = useStore((s) => s.previewUci);
  const setPreview = useStore((s) => s.setPreview);
  const playUci = useStore((s) => s.playUci);
  const setSettings = useStore((s) => s.setSettings);
  const opponent = useStore((s) => s.opponent);
  const takeover = useStore((s) => s.takeover);
  const playerColor = useStore((s) => s.playerColor);
  const queryKey = useStore((s) => explorerQueryFor(s).key);
  const [showAll, setShowAll] = useState(false);

  const fen = currentFen(game);
  const turn = turnOf(fen);
  const humanTurn = opponent === 'human' || takeover || turn === playerColor;
  const opening = useMemo(() => openingForLine(game.moves, game.ply, game.startFen), [game]);
  const current = opening.opening;
  const lineUci = useMemo(() => game.moves.slice(0, game.ply).map((m) => m.uci), [game]);
  const book = useMemo(() => bookContinuations(fen, lineUci), [fen, lineUci]);

  const live = explorer.key === queryKey ? explorer : null;
  const status = live?.status ?? (tutorEnabled ? 'loading' : 'idle');
  const data = live?.data ?? null;

  const onTap = (uci: string) => {
    if (previewUci === uci) playUci(uci);
    else setPreview(uci);
  };
  const onLongPress = (uci: string) => {
    playUci(uci);
  };

  if (!tutorEnabled) {
    return (
      <div className="space-y-3 p-3 text-sm text-muted">
        <p>{t('explorer.tutorOff')}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setSettings({ tutorEnabled: true })}
        >
          {t('explorer.tutorOn')}
        </button>
      </div>
    );
  }

  const apiMoves = data?.moves ?? [];
  const shownApi = showAll ? apiMoves : apiMoves.slice(0, DEFAULT_ROWS);
  const apiUcis = new Set(apiMoves.map((m) => m.uci));
  const extraBook = book.filter((b) => !apiUcis.has(b.uci) && b.opening);

  const nameForApiMove = (m: ExplorerMove) => {
    const after = epdAfter(fen, m.uci);
    const target = m.opening ?? (after ? (lookupEpd(after) ?? null) : null);
    return leadLabel(target, current);
  };
  const nameForBookMove = (b: BookContinuation) => leadLabel(b.opening ?? b.example, current);

  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="seg">
          <button
            type="button"
            aria-pressed={explorerDb === 'lichess'}
            onClick={() => setSettings({ explorerDb: 'lichess' })}
          >
            {t('explorer.db.lichess')}
          </button>
          <button
            type="button"
            aria-pressed={explorerDb === 'masters'}
            onClick={() => setSettings({ explorerDb: 'masters' })}
          >
            {t('explorer.db.masters')}
          </button>
        </div>
        {data && (
          <span className="text-xs text-muted">
            {formatCount(total(data))} {t('explorer.games')}
          </span>
        )}
      </div>

      {status === 'loading' && <p className="text-xs text-muted">{t('explorer.loading')}</p>}
      {status === 'offline' && <p className="text-xs text-muted">{t('explorer.offline')}</p>}
      {status === 'ratelimited' && (
        <p className="text-xs text-muted">{t('explorer.rateLimited')}</p>
      )}
      {status === 'error' && <p className="text-xs text-muted">{t('explorer.error')}</p>}
      {status === 'unauthorized' && (
        <div className="card flex flex-col gap-2 p-3 text-xs text-muted">
          <p>{t('lichess.required')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void startLogin()}>
              {t('lichess.login')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => useStore.getState().setPanelTab('settings')}
            >
              {t('lichess.tokenLabel')}
            </button>
          </div>
        </div>
      )}
      {status === 'skipped' && (
        <p className="text-xs text-muted">{t('explorer.opponentTurnHidden')}</p>
      )}
      {status === 'empty' && <p className="text-xs text-muted">{t('explorer.noData')}</p>}

      {data && apiMoves.length > 0 && (
        <div className="space-y-0.5">
          <h3 className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {t('explorer.popular')}
          </h3>
          {shownApi.map((m) => {
            const lead = nameForApiMove(m);
            return (
              <Row
                key={m.uci}
                uci={m.uci}
                san={m.san}
                selected={previewUci === m.uci}
                onTap={onTap}
                onLongPress={onLongPress}
              >
                <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted">
                  {movePercent(m, data)}%
                </span>
                <div className="min-w-0 flex-1">
                  <Wdl white={m.white} draws={m.draws} black={m.black} />
                  {lead && <div className="mt-0.5 truncate text-[11px] text-muted">→ {lead}</div>}
                </div>
              </Row>
            );
          })}
          {apiMoves.length > DEFAULT_ROWS && (
            <button
              type="button"
              className="px-2 py-1 text-xs text-accent"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? '−' : `+${apiMoves.length - DEFAULT_ROWS}`}
            </button>
          )}
        </div>
      )}

      {(!data || apiMoves.length === 0 || extraBook.length > 0) && (
        <div className="space-y-0.5">
          <h3 className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {t('explorer.bookSource')}
          </h3>
          {(data && apiMoves.length > 0 ? extraBook : book).length === 0 && (
            <p className="px-2 text-xs text-muted">{t('explorer.noBook')}</p>
          )}
          {(data && apiMoves.length > 0 ? extraBook : book).slice(0, showAll ? 40 : 8).map((b) => {
            const lead = nameForBookMove(b);
            return (
              <Row
                key={b.uci}
                uci={b.uci}
                san={b.san}
                selected={previewUci === b.uci}
                onTap={onTap}
                onLongPress={onLongPress}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs">{lead ?? b.opening?.name ?? ''}</div>
                  {b.lines > 0 && (
                    <div className="text-[11px] text-muted">
                      {b.lines} {t('library.variations')}
                      {b.opening && b.example && b.example.name !== b.opening.name
                        ? ` · ${b.example.eco}`
                        : ''}
                    </div>
                  )}
                </div>
                {b.opening && <span className="eco shrink-0">{b.opening.eco}</span>}
              </Row>
            );
          })}
        </div>
      )}

      {previewUci && (
        <div className="card flex items-center justify-between gap-2 px-3 py-2 text-xs">
          <span className="text-muted">{t('explorer.tapAgain')}</span>
          {!humanTurn && (
            <button
              type="button"
              className="btn px-2 py-1 text-xs"
              onClick={() => playUci(previewUci)}
            >
              {t('explorer.playForOpponent')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
