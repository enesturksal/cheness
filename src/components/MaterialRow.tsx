import { useMemo } from 'react';
import { opposite, type Color } from '../game/game';
import { materialOf, type PieceType } from '../game/material';
import { selectFen, useStore } from '../store/useStore';

const ROLE: Record<PieceType, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
};

/** One side's name, the pieces it has captured and its point advantage (chess.com style). */
export function MaterialRow({ color, label }: { color: Color; label: string }) {
  const fen = useStore(selectFen);
  const m = useMemo(() => materialOf(fen), [fen]);
  const captured = m.capturedBy[color];
  const advantage = color === 'white' ? m.diff : -m.diff;
  return (
    <div className="flex h-6 items-center gap-2 px-1 text-xs">
      <span className="font-semibold">{label}</span>
      <span className="cg-wrap material flex items-center">
        {captured.map((t, i) => (
          <piece key={i} className={`${opposite(color)} ${ROLE[t]} material-piece`} />
        ))}
      </span>
      {advantage > 0 && <span className="text-muted">+{advantage}</span>}
    </div>
  );
}
