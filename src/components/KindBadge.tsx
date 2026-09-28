import { glyph, type MoveKind } from '../engine/analysis';

/** Small coloured marker with the Lichess-style glyph (or a dot when the kind has none). */
export function KindBadge({ kind, title }: { kind: MoveKind; title?: string }) {
  const g = glyph(kind);
  return (
    <span className={`kind kind-${kind}`} title={title} aria-label={title}>
      {g || '•'}
    </span>
  );
}
