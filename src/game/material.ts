import { Chess } from 'chess.js';
import type { Color } from './game';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q';

export const PIECE_VALUES: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const START: Record<PieceType, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
const ORDER: PieceType[] = ['p', 'n', 'b', 'r', 'q'];

export interface Material {
  /** Pieces each colour has captured (i.e. the opponent's missing pieces), cheapest first. */
  capturedBy: Record<Color, PieceType[]>;
  /** Point balance: positive when White is ahead. */
  diff: number;
}

/** chess.com-style material summary from a position (promotions are ignored, counts clamp at 0). */
export function materialOf(fen: string): Material {
  const counts: Record<Color, Record<PieceType, number>> = {
    white: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    black: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };
  for (const row of new Chess(fen).board()) {
    for (const sq of row) {
      if (!sq || sq.type === 'k') continue;
      counts[sq.color === 'w' ? 'white' : 'black'][sq.type as PieceType] += 1;
    }
  }
  const missing = (c: Color): PieceType[] =>
    ORDER.flatMap((t) => Array<PieceType>(Math.max(0, START[t] - counts[c][t])).fill(t));
  const capturedBy = { white: missing('black'), black: missing('white') };
  const value = (list: PieceType[]) => list.reduce((n, t) => n + PIECE_VALUES[t], 0);
  return { capturedBy, diff: value(capturedBy.white) - value(capturedBy.black) };
}
