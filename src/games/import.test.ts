import { describe, expect, it } from 'vitest';
import { openingStats, type ImportedGameSummary } from './import';

const g = (over: Partial<ImportedGameSummary>): ImportedGameSummary => ({
  id: 'x',
  platform: 'lichess',
  url: '',
  playedAt: 0,
  white: 'me',
  black: 'them',
  result: '1-0',
  speed: 'blitz',
  myColor: 'white',
  opening: { eco: 'B20', name: 'Sicilian Defense: Najdorf Variation' },
  moves: [],
  ...over,
});

describe('opening stats', () => {
  it('groups by family and scores from the player side', () => {
    const stats = openingStats([
      g({}),
      g({ result: '0-1', opening: { eco: 'B90', name: 'Sicilian Defense: Open' } }),
      g({ myColor: 'black', result: '0-1', opening: { name: 'French Defense' } }),
      g({ myColor: 'black', result: '1/2-1/2', opening: { name: 'French Defense' } }),
    ]);
    expect(stats[0]).toMatchObject({
      name: 'Sicilian Defense',
      games: 2,
      wins: 1,
      losses: 1,
      asWhite: 2,
    });
    expect(stats[1]).toMatchObject({
      name: 'French Defense',
      games: 2,
      wins: 1,
      draws: 1,
      asBlack: 2,
    });
  });
});
