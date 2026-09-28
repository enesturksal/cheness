/**
 * Move-quality classification, Lichess/chess.com style.
 *
 * Scores are converted to win probability (0-100, Lichess's logistic model) and a move is
 * judged by how much win probability it gives away compared to the engine's best move.
 * Thresholds follow Lichess's published ones (inaccuracy >= 5, mistake >= 10, blunder >= 15
 * win-percentage points) with finer bands below that, in the spirit of chess.com's labels.
 */
export type MoveKind =
  'book' | 'best' | 'great' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

/** Engine score from the perspective of the side to move in that position. */
export interface Score {
  cp: number | null;
  mate: number | null;
}

export interface MoveAnnotation {
  uci: string;
  kind: MoveKind;
  /** Engine's preferred move in the position before this move. */
  bestMove: string | null;
  bestSan?: string;
  /** Score of the position before the move (mover's perspective, best play). */
  before: Score;
  /** Score after the move (mover's perspective). */
  after: Score;
  /** Win-probability points lost by the move (>= 0). */
  loss: number;
  depth: number;
}

const MATE_CP = 10_000;

/** Collapse mate scores into a large centipawn value so they sort and convert sanely. */
export function scoreToCp(s: Score): number {
  if (s.mate !== null) return s.mate > 0 ? MATE_CP - s.mate : -MATE_CP - s.mate;
  return s.cp ?? 0;
}

export function negateScore(s: Score): Score {
  return { cp: s.cp === null ? null : -s.cp, mate: s.mate === null ? null : -s.mate };
}

/** Lichess win-probability model: 50 + 50 * (2 / (1 + e^(-0.00368208 * cp)) - 1). */
export function winPercent(cp: number): number {
  const clamped = Math.max(-MATE_CP, Math.min(MATE_CP, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1);
}

export function scoreWinPercent(s: Score): number {
  if (s.mate !== null) return s.mate > 0 ? 100 : 0;
  return winPercent(s.cp ?? 0);
}

/** Human-readable score like "+0.3", "-1.7", "#3" or "#-2", from White's perspective. */
export function formatScore(s: Score): string {
  if (s.mate !== null) return s.mate > 0 ? `#${s.mate}` : `#-${Math.abs(s.mate)}`;
  const pawns = (s.cp ?? 0) / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

export interface ClassifyInput {
  uci: string;
  bestMove: string | null;
  /** Best-line score before the move (mover's perspective). */
  before: Score;
  /** Second-best line score before the move (mover's perspective), if known. */
  secondBest?: Score | null;
  /** Score after the move (mover's perspective). */
  after: Score;
  /** Whether the position after the move is a known opening-book position. */
  inBook: boolean;
}

export const GREAT_GAP = 10;

export function classify(i: ClassifyInput): { kind: MoveKind; loss: number } {
  const wpBefore = scoreWinPercent(i.before);
  const wpAfter = scoreWinPercent(i.after);
  const loss = Math.max(0, Math.round((wpBefore - wpAfter) * 10) / 10);

  if (i.inBook) return { kind: 'book', loss };
  if (i.bestMove && i.uci === i.bestMove) {
    if (i.secondBest && wpBefore - scoreWinPercent(i.secondBest) >= GREAT_GAP) {
      return { kind: 'great', loss };
    }
    return { kind: 'best', loss };
  }
  if (loss < 1) return { kind: 'excellent', loss };
  if (loss < 5) return { kind: 'good', loss };
  if (loss < 10) return { kind: 'inaccuracy', loss };
  if (loss < 15) return { kind: 'mistake', loss };
  return { kind: 'blunder', loss };
}

/** i18n key of each kind's label (keys live in src/i18n/strings.ts). */
export const KIND_LABEL_KEY = {
  book: 'kind.book',
  best: 'kind.best',
  great: 'kind.great',
  excellent: 'kind.excellent',
  good: 'kind.good',
  inaccuracy: 'kind.inaccuracy',
  mistake: 'kind.mistake',
  blunder: 'kind.blunder',
} as const satisfies Record<MoveKind, string>;

/** Lichess-style annotation glyph for a move kind ("" when none). */
export function glyph(kind: MoveKind): string {
  switch (kind) {
    case 'great':
      return '!';
    case 'inaccuracy':
      return '?!';
    case 'mistake':
      return '?';
    case 'blunder':
      return '??';
    default:
      return '';
  }
}

export type AnalysisDepth = 0 | 10 | 14 | 18;
export const ANALYSIS_DEPTHS: readonly { depth: AnalysisDepth; key: string }[] = [
  { depth: 0, key: 'analysis.off' },
  { depth: 10, key: 'analysis.fast' },
  { depth: 14, key: 'analysis.balanced' },
  { depth: 18, key: 'analysis.deep' },
];
