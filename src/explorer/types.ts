export type ExplorerDb = 'lichess' | 'masters';

export type Speed = 'ultraBullet' | 'bullet' | 'blitz' | 'rapid' | 'classical' | 'correspondence';

/** Rating groups accepted by the Lichess explorer; each spans up to the next value. */
export const RATING_BUCKETS = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500] as const;
export type RatingBucket = (typeof RATING_BUCKETS)[number];

export const ALL_SPEEDS: readonly Speed[] = [
  'ultraBullet',
  'bullet',
  'blitz',
  'rapid',
  'classical',
  'correspondence',
];

export const DEFAULT_SPEEDS: Speed[] = ['blitz', 'rapid', 'classical'];
export const DEFAULT_RATINGS: RatingBucket[] = [1000, 1200, 1400, 1600, 1800, 2000];

export interface OpeningName {
  eco: string;
  name: string;
}

export interface ExplorerMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number | null;
  /** Name of the position this move leads to, when Lichess knows it. */
  opening: OpeningName | null;
}

export interface ExplorerResponse {
  white: number;
  draws: number;
  black: number;
  moves: ExplorerMove[];
  opening: OpeningName | null;
}

export interface ExplorerQuery {
  db: ExplorerDb;
  /** EPD (FEN without counters) of the position to look up. */
  epd: string;
  ratings: RatingBucket[];
  speeds: Speed[];
  /** Number of most common moves to return (default 12). */
  moves?: number;
}
