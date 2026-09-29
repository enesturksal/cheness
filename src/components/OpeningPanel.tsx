import { useMemo, useState } from 'react';
import { formatScore, negateScore, type MoveAnnotation } from '../engine/analysis';
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
import type { ExplorerGame, ExplorerMove, OpeningName } from '../explorer/types';
import { currentFen, epdAfter, turnOf } from '../game/game';
import { openReferenceGame, resultOf } from '../games/openReference';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { KindBadge } from './KindBadge';
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
  /** This move was played in the game being viewed. */
  played?: MoveAnnotation | null | false;
  onTap: (uci: string) => void;
  onLongPress: (uci: string) => void;
  children: React.ReactNode;
}

function Row({ uci, san, selected, played, onTap, onLongPress, children }: RowProps) {
  const t = useT();
  const handlers = useLongPress(
    () => onLongPress(uci),
    () => onTap(uci),
  );
  const isPlayed = played !== undefined && played !== false;
  return (
    <button
      type="button"
      {...handlers}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
        selected ? 'bg-bg3 ring-1 ring-accent' : isPlayed ? 'row-played' : 'hover:bg-bg3'
      }`}
    >
      <span className="w-12 shrink-0 font-semibold">
        {san}
        {isPlayed && (
          <span className="mt-0.5 flex items-center gap-1">
            <span className="chip chip-played">{t('panel.played')}</span>
            {played && <KindBadge kind={played.kind} />}
          </span>
        )}
      </span>
      {children}
    </button>
  );
}

function ReferenceGames({ games, db }: { games: ExplorerGame[]; db: 'lichess' | 'masters' }) {
  const t = useT();
  const token = useStore((s) => s.lichessToken);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  if (games.length === 0) return null;
  const open = async (g: ExplorerGame) => {
    setBusy(g.id);
    setFailed(null);
    try {
      await openReferenceGame(g, db, token);
    } catch {
      setFailed(g.id);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-0.5">
      <h3 className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {db === 'masters' ? t('panel.masterGames') : t('panel.games')}
      </h3>
      {games.slice(0, 6).map((g) => (
        <div key={g.id} className="flex items-center gap-2 px-2 py-1 text-xs">
          <div className="min-w-0 flex-1">
            <div className="truncate">
              <span className={g.winner === 'white' ? 'font-semibold' : ''}>{g.white.name}</span>
              {g.white.rating ? ` (${g.white.rating})` : ''} –{' '}
              <span className={g.winner === 'black' ? 'font-semibold' : ''}>{g.black.name}</span>
              {g.black.rating ? ` (${g.black.rating})` : ''}
            </div>
            <div className="text-muted">
              {g.year ?? ''}
              {g.speed ? ` · ${g.speed}` : ''} · {resultOf(g)}
              {failed === g.id ? ` · ${t('panel.gameFailed')}` : ''}
            </div>
          </div>
          <button
            type="button"
            className="btn px-2 py-1 text-xs"
            disabled={busy !== null}
            onClick={() => void open(g)}
          >
            {busy === g.id ? '…' : t('panel.openGame')}
          </button>
        </div>
      ))}
    </div>
  );
}

export function OpeningPanel() {
  const t = useT();
  const game = useStore((s) => s.game);
  const annotations = useStore((s) => s.annotations);
  const explorer = useStore((s) => s.explorer);
  const suggestions = useStore((s) => s.suggestions);
  const tutorEnabled = useStore((s) => s.tutorEnabled);
  const explorerDb = useStore((s) => s.explorerDb);
  const previewUci = useStore((s) => s.previewUci);
  const setPreview = useStore((s) => s.setPreview);
  const playUci = useStore((s) => s.playUci);
  const setSettings = useStore((s) => s.setSettings);
  const setView = useStore((s) => s.setView);
  const mode = useStore((s) => s.mode);
  const takeover = useStore((s) => s.takeover);
  const playerColor = useStore((s) => s.playerColor);
  const queryKey = useStore((s) => explorerQueryFor(s).key);
  const [showAll, setShowAll] = useState(false);

  const fen = currentFen(game);
  const turn = turnOf(fen);
  const humanTurn = mode !== 'bot' || takeover || turn === playerColor;
  const opening = useMemo(() => openingForLine(game.moves, game.ply, game.startFen), [game]);
  const current = opening.opening;
  const lineUci = useMemo(() => game.moves.slice(0, game.ply).map((m) => m.uci), [game]);
  const book = useMemo(() => bookContinuations(fen, lineUci), [fen, lineUci]);

  // When reviewing (cursor not at the tip), the next move of the game is "what you played".
  const playedIdx = game.ply < game.moves.length ? game.ply : -1;
  const playedUci = playedIdx >= 0 ? game.moves[playedIdx].uci : null;
  const playedSan = playedIdx >= 0 ? game.moves[playedIdx].san : null;
  const playedAnn =
    playedIdx >= 0 && annotations[playedIdx]?.uci === playedUci ? annotations[playedIdx] : null;
  const playedFlag = (uci: string) => (playedUci === uci ? playedAnn : false);

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
  const shownApi = showAll ? [...apiMoves] : apiMoves.slice(0, DEFAULT_ROWS);
  if (playedUci && !shownApi.some((m) => m.uci === playedUci)) {
    const extra = apiMoves.find((m) => m.uci === playedUci);
    if (extra) shownApi.push(extra);
  }
  const playedMissing = !!(data && playedUci && !apiMoves.some((m) => m.uci === playedUci));
  const apiUcis = new Set(apiMoves.map((m) => m.uci));
  const extraBook = book.filter((b) => !apiUcis.has(b.uci) && b.opening);
  const bookRows = data && apiMoves.length > 0 ? extraBook : book;
  const showSuggestions =
    apiMoves.length === 0 &&
    suggestions.fen === fen &&
    suggestions.status === 'ok' &&
    suggestions.lines.length > 0;

  const nameAfter = (uci: string, api: OpeningName | null = null) => {
    const after = epdAfter(fen, uci);
    const target = api ?? (after ? (lookupEpd(after) ?? null) : null);
    return leadLabel(target, current);
  };
  const nameForApiMove = (m: ExplorerMove) => nameAfter(m.uci, m.opening);
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
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-xs text-muted">
              {formatCount(total(data))} {t('explorer.games')}
            </span>
          )}
          <button
            type="button"
            className="btn-icon px-2 py-1 text-xs"
            title={t('sources.title')}
            aria-label={t('sources.title')}
            onClick={() => setView('sources')}
          >
            i
          </button>
        </div>
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
            <button type="button" className="btn" onClick={() => setView('profile')}>
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
                played={playedFlag(m.uci)}
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
          {playedMissing && playedUci && playedSan && (
            <div className="row-played flex items-center gap-2 rounded-lg px-2 py-2 text-xs">
              <span className="w-12 shrink-0 font-semibold">{playedSan}</span>
              <span className="chip chip-played">{t('panel.played')}</span>
              {playedAnn && <KindBadge kind={playedAnn.kind} />}
              <span className="text-muted">{t('panel.playedNotListed')}</span>
            </div>
          )}
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

      {data && data.topGames.length > 0 && <ReferenceGames games={data.topGames} db={explorerDb} />}

      {showSuggestions && (
        <div className="space-y-0.5">
          <h3 className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {suggestions.source === 'cloud'
              ? t('arrows.cloud')
              : suggestions.source === 'chessdb'
                ? t('arrows.chessdb')
                : t('arrows.engine')}
            {suggestions.depth ? ` · d${suggestions.depth}` : ''}
          </h3>
          {suggestions.lines.map((l) => {
            const white = turn === 'white' ? l.score : negateScore(l.score);
            const lead = nameAfter(l.uci);
            return (
              <Row
                key={l.uci}
                uci={l.uci}
                san={l.san}
                selected={previewUci === l.uci}
                played={playedFlag(l.uci)}
                onTap={onTap}
                onLongPress={onLongPress}
              >
                <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted">
                  {formatScore(white)}
                </span>
                <div className="min-w-0 flex-1 truncate text-[11px] text-muted">
                  {lead ? `→ ${lead}` : ''}
                </div>
              </Row>
            );
          })}
        </div>
      )}

      {(!data || apiMoves.length === 0 || extraBook.length > 0) && (
        <div className="space-y-0.5">
          <h3 className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {t('explorer.bookSource')}
          </h3>
          {bookRows.length === 0 && (
            <p className="px-2 text-xs text-muted">{t('explorer.noBook')}</p>
          )}
          {bookRows.slice(0, showAll ? 40 : 8).map((b) => {
            const lead = nameForBookMove(b);
            return (
              <Row
                key={b.uci}
                uci={b.uci}
                san={b.san}
                selected={previewUci === b.uci}
                played={playedFlag(b.uci)}
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
          {bookRows.length > 8 && (
            <button
              type="button"
              className="px-2 py-1 text-xs text-accent"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? '−' : `+${bookRows.length - 8}`}
            </button>
          )}
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
