import { useMemo } from 'react';
import {
  formatScore,
  glyph,
  KIND_LABEL_KEY,
  negateScore,
  scoreWinPercent,
  type MoveAnnotation,
  type Score,
} from '../engine/analysis';
import { openingForLine } from '../explorer/book';
import { currentFen, movetext, statusOf, turnOf, type MoveRecord } from '../game/game';
import { useT } from '../i18n/useT';
import { humanToMove, useStore } from '../store/useStore';
import { KindBadge } from './KindBadge';

interface VerdictRow {
  who: string;
  mine: boolean;
  move: MoveRecord;
  ann: MoveAnnotation | null;
}

/** Opening name, whose turn / result, and the engine verdicts on the last two moves. */
export function StatusBar() {
  const t = useT();
  const game = useStore((s) => s.game);
  const annotations = useStore((s) => s.annotations);
  const meta = useStore((s) => s.meta);
  const mode = useStore((s) => s.mode);
  const playerColor = useStore((s) => s.playerColor);
  const analysisDepth = useStore((s) => s.analysisDepth);
  const botThinking = useStore((s) => s.botThinking);
  const engineStatus = useStore((s) => s.engineStatus);
  const human = useStore(humanToMove);

  const fen = currentFen(game);
  const status = statusOf(fen);
  const opening = useMemo(() => openingForLine(game.moves, game.ply, game.startFen), [game]);

  let line: string;
  if (status.over) {
    const who =
      status.result === '1-0'
        ? t('status.whiteWins')
        : status.result === '0-1'
          ? t('status.blackWins')
          : t('status.draw');
    const reason =
      status.reason === 'checkmate'
        ? t('status.checkmate')
        : status.reason === 'stalemate'
          ? t('status.stalemate')
          : status.reason === 'insufficient'
            ? t('status.insufficient')
            : status.reason === 'threefold'
              ? t('status.threefold')
              : t('status.fiftyMoves');
    line = status.reason === 'checkmate' ? `${reason} — ${who}` : reason;
  } else if (botThinking) {
    line = engineStatus === 'loading' ? t('bot.loading') : t('bot.thinking');
  } else if (engineStatus === 'error' && !human) {
    line = t('bot.error');
  } else if (human) {
    line = t('status.yourMove');
  } else {
    line = turnOf(fen) === 'white' ? t('status.whiteToMove') : t('status.blackToMove');
  }
  if (!status.over && status.check) line += ` · ${t('status.check')}`;

  // Who made a move, for the verdict rows.
  const whoFor = (m: MoveRecord): { who: string; mine: boolean } => {
    if (mode === 'bot') {
      const mine = m.color === playerColor;
      return { who: mine ? t('status.you') : 'Stockfish', mine };
    }
    if (mode === 'analysis' && meta && (meta.white || meta.black)) {
      const name = m.color === 'white' ? meta.white : meta.black;
      return {
        who: (name ?? (m.color === 'white' ? t('side.white') : t('side.black'))).split(' (')[0],
        mine: m.color === playerColor,
      };
    }
    return { who: m.color === 'white' ? t('side.white') : t('side.black'), mine: true };
  };

  // The last two moves up to the cursor: yours and the opponent's (yours listed first in bot games).
  const rows: VerdictRow[] = [];
  for (const i of [game.ply - 1, game.ply - 2]) {
    if (i < 0) continue;
    const move = game.moves[i];
    const ann = annotations[i]?.uci === move.uci ? annotations[i] : null;
    rows.push({ ...whoFor(move), move, ann });
  }
  if (mode === 'bot') rows.sort((a, b) => Number(b.mine) - Number(a.mine));

  // Eval of the viewed position from White's side.
  const lastMove = game.ply > 0 ? game.moves[game.ply - 1] : null;
  const lastAnn =
    lastMove && annotations[game.ply - 1]?.uci === lastMove.uci ? annotations[game.ply - 1] : null;
  let whiteScore: Score | null = null;
  if (lastAnn && lastMove)
    whiteScore = lastMove.color === 'white' ? lastAnn.after : negateScore(lastAnn.after);
  else if (game.ply === 0 && annotations[0] && game.moves[0]) {
    whiteScore =
      game.moves[0].color === 'white' ? annotations[0].before : negateScore(annotations[0].before);
  }
  const whitePct = whiteScore ? scoreWinPercent(whiteScore) : null;
  const analysing = analysisDepth > 0 && lastMove && !lastAnn && !status.over;

  return (
    <div className="px-1 py-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {opening.opening ? (
              <>
                <span className="eco">{opening.opening.eco}</span>
                <span className="truncate text-sm font-semibold">{opening.opening.name}</span>
                {opening.outOfBook && (
                  <span className="chip border-dashed text-muted">{t('explorer.outOfBook')}</span>
                )}
              </>
            ) : (
              <span className="text-sm font-semibold text-muted">
                {game.ply === 0 ? t('explorer.startPosition') : '—'}
              </span>
            )}
          </div>
          {meta && (meta.white || meta.black) && (
            <div className="truncate text-[11px] text-muted">
              {meta.white ?? '?'} – {meta.black ?? '?'}
              {meta.result && meta.result !== '*' ? ` · ${meta.result}` : ''}
            </div>
          )}
          {game.ply > 0 && (
            <div className="truncate font-mono text-[11px] text-muted">{movetext(game)}</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
          {botThinking && <span className="thinking-dot size-2 rounded-full bg-accent" />}
          <span>{line}</span>
        </div>
      </div>

      {analysisDepth > 0 && (rows.length > 0 || whitePct !== null) && (
        <div className="mt-1.5 flex items-start gap-2 text-xs">
          {whitePct !== null && whiteScore && (
            <div className="evalbar mt-0.5" title={formatScore(whiteScore)}>
              <div className="evalbar-white" style={{ width: `${whitePct}%` }} />
              <span className="evalbar-label">{formatScore(whiteScore)}</span>
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-0.5">
            {rows.map((r) => (
              <div key={r.move.uci + r.who} className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`w-14 shrink-0 truncate ${r.mine ? 'font-semibold' : 'text-muted'}`}
                >
                  {r.who}
                </span>
                {r.ann ? (
                  <>
                    <KindBadge kind={r.ann.kind} />
                    <span className="font-medium">
                      {r.move.san}
                      {glyph(r.ann.kind)}
                    </span>
                    <span className="text-muted">{t(KIND_LABEL_KEY[r.ann.kind])}</span>
                    {r.ann.bestSan &&
                      (r.ann.kind === 'inaccuracy' ||
                        r.ann.kind === 'mistake' ||
                        r.ann.kind === 'blunder') && (
                        <span className="truncate text-muted">
                          · {t('analysis.bestWas')}{' '}
                          <strong className="text-fg">{r.ann.bestSan}</strong>
                        </span>
                      )}
                  </>
                ) : (
                  <span className="text-muted">
                    {r.move.san} · {analysing ? t('analysis.analyzing') : '…'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
