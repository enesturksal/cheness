import { describe, expect, it } from 'vitest';
import { familyOf, lookupEpd } from '../explorer/book';
import { gameFromUciLine } from '../game/game';
import { POPULAR_BLACK, POPULAR_WHITE } from './popularOpenings';

describe('popular openings', () => {
  it('reference real families and legal, named lines', () => {
    for (const o of [...POPULAR_WHITE, ...POPULAR_BLACK]) {
      expect(familyOf(o.family), o.family).toBeDefined();
      const g = gameFromUciLine(o.line);
      expect(g, o.family).not.toBeNull();
      // The book sometimes files a line under a parent family
      // (e.g. "Queen's Pawn Game: London System"), so match by name.
      const named = lookupEpd(g!.moves[g!.moves.length - 1].epd);
      expect(named?.name ?? '', `${o.family} line`).toContain(o.family);
    }
  });
});
