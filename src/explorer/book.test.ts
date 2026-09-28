import { describe, expect, it } from 'vitest';
import { currentFen, gameFromUciLine, START_FEN } from '../game/game';
import {
  allOpenings,
  bookContinuations,
  bookMeta,
  families,
  familiesByVolume,
  lookupEpd,
  openingForLine,
  searchOpenings,
} from './book';

describe('offline opening book', () => {
  it('loads the generated data', () => {
    expect(allOpenings().length).toBe(bookMeta().count);
    expect(allOpenings().length).toBeGreaterThan(3000);
  });

  it('resolves names by EPD, including transpositions', () => {
    const sicilian = gameFromUciLine(['e2e4', 'c7c5'])!;
    expect(lookupEpd(sicilian.moves[1].epd)?.name).toBe('Sicilian Defense');
    // 1. Nf3 d5 2. d4 and 1. d4 d5 2. Nf3 reach the same position
    const a = gameFromUciLine(['g1f3', 'd7d5', 'd2d4'])!;
    const b = gameFromUciLine(['d2d4', 'd7d5', 'g1f3'])!;
    expect(a.moves[2].epd).toBe(b.moves[2].epd);
    expect(lookupEpd(a.moves[2].epd)).toBeDefined();
  });

  it('keeps the last known name when leaving the book', () => {
    const g = gameFromUciLine([
      'e2e4',
      'c7c5',
      'g1f3',
      'd7d6',
      'd2d4',
      'c5d4',
      'f3d4',
      'g8f6',
      'b1c3',
      'a7a6',
    ])!;
    const inBook = openingForLine(g.moves, g.ply);
    expect(inBook.opening?.name).toContain('Najdorf');
    expect(inBook.outOfBook).toBe(false);

    const wild = gameFromUciLine([...g.moves.map((m) => m.uci), 'h2h4', 'h7h5', 'a2a4'])!;
    const out = openingForLine(wild.moves, wild.ply);
    expect(out.opening?.name).toContain('Najdorf');
    expect(out.outOfBook).toBe(true);
  });

  it('returns nothing before any book position', () => {
    const s = openingForLine([], 0, '8/8/8/8/8/8/8/k6K w - - 0 1');
    expect(s.opening).toBeNull();
    expect(s.outOfBook).toBe(false);
  });

  it('lists named continuations from the start position', () => {
    const c = bookContinuations(START_FEN, []);
    const e4 = c.find((x) => x.san === 'e4');
    expect(e4?.opening?.name).toBe("King's Pawn Game");
    expect(e4!.lines).toBeGreaterThan(500);
    expect(c[0].lines).toBeGreaterThanOrEqual(c[c.length - 1].lines);
  });

  it('lists continuations deeper in a line and via transposition', () => {
    const g = gameFromUciLine([
      'e2e4',
      'c7c5',
      'g1f3',
      'd7d6',
      'd2d4',
      'c5d4',
      'f3d4',
      'g8f6',
      'b1c3',
    ])!;
    const c = bookContinuations(
      currentFen(g),
      g.moves.map((m) => m.uci),
    );
    const a6 = c.find((x) => x.san === 'a6');
    expect(a6?.opening?.name).toContain('Najdorf');
    expect(a6!.lines).toBeGreaterThan(5);
    // Reached by a different move order; the book line 1. d4 d5 2. Nf3 ... must still be found
    const t = gameFromUciLine(['g1f3', 'd7d5', 'd2d4'])!;
    const tc = bookContinuations(
      currentFen(t),
      t.moves.map((m) => m.uci),
    );
    expect(tc.some((x) => x.san === 'Nf6' && x.lines > 0)).toBe(true);
  });

  it('searches by name and ECO', () => {
    expect(searchOpenings('najdorf').length).toBeGreaterThan(5);
    expect(searchOpenings('B90').every((e) => e.eco === 'B90')).toBe(true);
    expect(searchOpenings('kings indian')[0].name).toContain("King's Indian");
    expect(searchOpenings('')).toEqual([]);
  });

  it('groups openings into families by volume', () => {
    const fams = families();
    const sicilian = fams.find((f) => f.name === 'Sicilian Defense')!;
    expect(sicilian.volume).toBe('B');
    expect(sicilian.entries.length).toBeGreaterThan(100);
    expect(sicilian.ecoRange).toMatch(/^B\d\d–B\d\d$/);
    expect(familiesByVolume('E').every((f) => f.volume === 'E')).toBe(true);
    expect(fams.reduce((n, f) => n + f.entries.length, 0)).toBe(allOpenings().length);
  });
});
