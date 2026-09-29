import { formatScore, scoreWinPercent, type Score } from '../engine/analysis';
import type { Color } from '../game/game';

interface Props {
  /** White's perspective; null while nothing is known yet. */
  score: Score | null;
  orientation: Color;
  /** True while the engine is still evaluating the viewed position (last known value shown). */
  pending: boolean;
}

/** chess.com-style vertical evaluation bar: White's share grows from White's side of the board. */
export function EvalBar({ score, orientation, pending }: Props) {
  const pct = score ? scoreWinPercent(score) : 50;
  const label = score ? formatScore(score) : '…';
  const whiteAtBottom = orientation === 'white';
  const whiteAhead = pct >= 50;
  // The number sits inside the larger segment, at the end of the bar it grows from.
  const labelAtBottom = whiteAtBottom ? whiteAhead : !whiteAhead;
  return (
    <div
      className={`evalbar ${pending ? 'evalbar-pending' : ''}`}
      title={label}
      role="img"
      aria-label={`eval ${label}`}
    >
      <div
        className="evalbar-white"
        style={{ height: `${pct}%`, [whiteAtBottom ? 'bottom' : 'top']: 0 }}
      />
      <span
        className={`evalbar-label ${labelAtBottom ? 'bottom-1' : 'top-1'} ${
          whiteAhead ? 'text-black' : 'text-white'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
