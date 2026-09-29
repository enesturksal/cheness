import { describe, expect, it } from 'vitest';
import { START_FEN } from './game';
import { materialOf } from './material';

describe('material', () => {
  it('is empty at the start', () => {
    const m = materialOf(START_FEN);
    expect(m.capturedBy.white).toEqual([]);
    expect(m.capturedBy.black).toEqual([]);
    expect(m.diff).toBe(0);
  });

  it('shows captured pieces and the point balance (rook for bishop, pawn up)', () => {
    // White is missing a bishop and two pawns; Black is missing a rook and two pawns.
    const fen = 'Q1bqkbnr/p4ppp/p3p3/8/3n4/8/PPP2PPP/RNB1K1NR w KQk - 0 10';
    const m = materialOf(fen);
    expect(m.capturedBy.white).toEqual(['p', 'p', 'r']);
    expect(m.capturedBy.black).toEqual(['p', 'p', 'b']);
    expect(m.diff).toBe(7 - 5);
  });
});
