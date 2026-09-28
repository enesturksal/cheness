import { useMemo } from 'react';
import {
  formatScore,
  glyph,
  KIND_LABEL_KEY,
  negateScore,
  scoreWinPercent,
  type Score,
} from '../engine/analysis';
import { openingForLine } from '../explorer/book';
import { currentFen, movetext, statusOf, turnOf } from '../game/game';
import { useT } from '../i18n/useT';
import { humanToMove, useStore } from '../store/useStore';
import { KindBadge } from './KindBadge';

/** Opening name, whose turn / result, and the engine verdict on the last move. */
export function StatusBar() {
  const t = useT();
  const game = useStore((s) => s.game);
  const annotations = useStore((s) => s.annotations);
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

  // Verdict for the move that led to the viewed position, plus the eval from White's side.
  const lastMove = game.ply > 0 ? game.moves[game.ply - 1] : null;
  const ann =
    lastMove && annotations[game.ply - 1]?.uci === lastMove.uci ? annotations[game.ply - 1] : null;
  let whiteScore: Score | null = null;
  if (ann && lastMove) whiteScore = lastMove.color === 'white' ? ann.after : negateScore(ann.after);
  else if (game.ply === 0 && annotations[0] && game.moves[0]) {
    whiteScore =
      game.moves[0].color === 'white' ? annotations[0].before : negateScore(annotations[0].before);
  }
  const whitePct = whiteScore ? scoreWinPercent(whiteScore) : null;
  const analysing = analysisDepth > 0 && lastMove && !ann && !status.over;

  return (
    <div className="px-1 py-2">
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
          {game.ply > 0 && (
            <div className="truncate font-mono text-[11px] text-muted">{movetext(game)}</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
          {botThinking && <span className="thinking-dot size-2 rounded-full bg-accent" />}
          <span>{line}</span>
        </div>
      </div>

      {analysisDepth > 0 && (ann || analysing || whitePct !== null) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {whitePct !== null && whiteScore && (
            <div className="evalbar" title={formatScore(whiteScore)}>
              <div className="evalbar-white" style={{ width: `${whitePct}%` }} />
              <span className="evalbar-label">{formatScore(whiteScore)}</span>
            </div>
          )}
          {ann && lastMove ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <KindBadge kind={ann.kind} />
              <span className="font-medium">
                {lastMove.san}
                {glyph(ann.kind)}
              </span>
              <span className="text-muted">{t(KIND_LABEL_KEY[ann.kind])}</span>
              {ann.bestSan &&
                (ann.kind === 'inaccuracy' || ann.kind === 'mistake' || ann.kind === 'blunder') && (
                  <span className="truncate text-muted">
                    · {t('analysis.bestWas')} <strong className="text-fg">{ann.bestSan}</strong>
                  </span>
                )}
            </span>
          ) : (
            analysing && <span className="text-muted">{t('analysis.analyzing')}</span>
          )}
        </div>
      )}
    </div>
  );
}
