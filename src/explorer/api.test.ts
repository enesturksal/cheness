import { describe, expect, it } from 'vitest';
import { buildUrl, formatCount, movePercent, normalize, outcomePercents, queryKey } from './api';
import type { ExplorerQuery } from './types';

const epd = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';

describe('explorer api', () => {
  it('builds lichess urls with filters and no game lists', () => {
    const q: ExplorerQuery = {
      db: 'lichess',
      epd,
      ratings: [1000, 1200],
      speeds: ['blitz', 'rapid'],
    };
    const url = new URL(buildUrl(q));
    expect(url.origin).toBe('https://explorer.lichess.org');
    expect(url.pathname).toBe('/lichess');
    expect(url.searchParams.get('fen')).toBe(epd);
    expect(url.searchParams.get('ratings')).toBe('1000,1200');
    expect(url.searchParams.get('speeds')).toBe('blitz,rapid');
    expect(url.searchParams.get('topGames')).toBe('4');
    expect(url.searchParams.get('recentGames')).toBe('0');
    expect(url.searchParams.get('moves')).toBe('12');
  });

  it('builds masters urls without lichess-only params', () => {
    const url = new URL(buildUrl({ db: 'masters', epd, ratings: [1000], speeds: ['blitz'] }));
    expect(url.pathname).toBe('/masters');
    expect(url.searchParams.has('ratings')).toBe(false);
    expect(url.searchParams.has('speeds')).toBe(false);
  });

  it('cache keys ignore filter order and drop filters for masters', () => {
    const a = queryKey({ db: 'lichess', epd, ratings: [1200, 1000], speeds: ['rapid', 'blitz'] });
    const b = queryKey({ db: 'lichess', epd, ratings: [1000, 1200], speeds: ['blitz', 'rapid'] });
    expect(a).toBe(b);
    expect(queryKey({ db: 'masters', epd, ratings: [1000], speeds: [] })).toBe(`2|masters|${epd}`);
  });

  it('normalizes a response defensively', () => {
    const r = normalize({
      white: 10,
      draws: '2',
      black: 8,
      opening: { eco: 'B00', name: "King's Pawn Game" },
      moves: [
        {
          uci: 'e7e5',
          san: 'e5',
          white: 5,
          draws: 1,
          black: 4,
          averageRating: 1500,
          opening: null,
        },
        {
          uci: 'c7c5',
          san: 'c5',
          white: 5,
          draws: 1,
          black: 4,
          averageRating: null,
          opening: { eco: 'B20', name: 'Sicilian Defense' },
        },
        { bogus: true },
      ],
    });
    expect(r.draws).toBe(2);
    expect(r.moves).toHaveLength(2);
    expect(r.moves[1].opening?.name).toBe('Sicilian Defense');
    expect(r.moves[1].averageRating).toBeNull();
    expect(r.opening?.eco).toBe('B00');
    expect(r.topGames).toEqual([]);
    const withGames = normalize({
      moves: [],
      topGames: [
        {
          id: 'abc',
          winner: 'white',
          white: { name: 'Caruana', rating: 2820 },
          black: { name: 'Carlsen', rating: 2835 },
          year: 2018,
          month: '2018-11',
        },
      ],
    });
    expect(withGames.topGames[0]).toMatchObject({ id: 'abc', winner: 'white', year: 2018 });
    expect(withGames.topGames[0].black.rating).toBe(2835);
  });

  it('computes percentages', () => {
    expect(outcomePercents({ white: 50, draws: 25, black: 25 })).toEqual({
      white: 50,
      draws: 25,
      black: 25,
    });
    expect(outcomePercents({ white: 0, draws: 0, black: 0 })).toEqual({
      white: 0,
      draws: 0,
      black: 0,
    });
    expect(movePercent({ white: 1, draws: 1, black: 1 }, { white: 4, draws: 3, black: 3 })).toBe(
      30,
    );
  });

  it('formats counts', () => {
    expect(formatCount(950)).toBe('950');
    expect(formatCount(1500)).toBe('1.5k');
    expect(formatCount(25_000)).toBe('25k');
    expect(formatCount(3_200_000)).toBe('3.2M');
    expect(formatCount(238_760_182)).toBe('239M');
    expect(formatCount(4_528_100_000)).toBe('4.5B');
  });
});
