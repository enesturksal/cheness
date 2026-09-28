import { useMemo } from 'react';
import { openingForLine } from '../explorer/book';
import { currentFen, movetext, statusOf, turnOf } from '../game/game';
import { useT } from '../i18n/useT';
import { humanToMove, useStore } from '../store/useStore';

/** Opening name + whose turn / result, directly under the board. */
export function StatusBar() {
  const t = useT();
  const game = useStore((s) => s.game);
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

  return (
    <div className="flex items-start justify-between gap-3 px-1 py-2">
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
  );
}
