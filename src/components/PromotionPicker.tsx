import type { Color, PromotionPiece } from '../game/game';
import { useT } from '../i18n/useT';

const ROLES: { piece: PromotionPiece; role: string }[] = [
  { piece: 'q', role: 'queen' },
  { piece: 'r', role: 'rook' },
  { piece: 'b', role: 'bishop' },
  { piece: 'n', role: 'knight' },
];

interface Props {
  color: Color;
  onPick: (p: PromotionPiece) => void;
  onCancel: () => void;
}

/** Overlay shown on top of the board when a pawn reaches the last rank. */
export function PromotionPicker({ color, onPick, onCancel }: Props) {
  const t = useT();
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
      onClick={onCancel}
      role="dialog"
      aria-label={t('promotion.title')}
    >
      <div className="card flex gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        {ROLES.map(({ piece, role }) => (
          <button
            key={piece}
            type="button"
            className="cg-wrap size-16 rounded-lg bg-bg3 hover:bg-line"
            onClick={() => onPick(piece)}
            aria-label={role}
          >
            <piece className={`${color} ${role} block size-full`} />
          </button>
        ))}
      </div>
    </div>
  );
}
