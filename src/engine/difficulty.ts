/**
 * Bot difficulty levels. Each level maps to UCI `Skill Level` (0-20) plus a search budget.
 * `movetime` (ms) and `depth` are sent together; Stockfish stops at whichever comes first,
 * which keeps low levels snappy on phones and high levels bounded.
 * Elo figures are rough guides for the UI only.
 */
export type LevelId = 0 | 1 | 2 | 3 | 4 | 5;

export interface Level {
  id: LevelId;
  key:
    | 'level.beginner'
    | 'level.easy'
    | 'level.medium'
    | 'level.hard'
    | 'level.veryHard'
    | 'level.max';
  skill: number;
  depth: number;
  movetime: number;
  elo: string;
}

export const LEVELS: readonly Level[] = [
  { id: 0, key: 'level.beginner', skill: 0, depth: 1, movetime: 150, elo: '~500' },
  { id: 1, key: 'level.easy', skill: 3, depth: 3, movetime: 250, elo: '~900' },
  { id: 2, key: 'level.medium', skill: 7, depth: 6, movetime: 400, elo: '~1300' },
  { id: 3, key: 'level.hard', skill: 12, depth: 10, movetime: 700, elo: '~1700' },
  { id: 4, key: 'level.veryHard', skill: 17, depth: 14, movetime: 1200, elo: '~2100' },
  { id: 5, key: 'level.max', skill: 20, depth: 22, movetime: 2500, elo: '2500+' },
];

export const DEFAULT_LEVEL: LevelId = 2;

export function levelById(id: LevelId): Level {
  return LEVELS[id] ?? LEVELS[DEFAULT_LEVEL];
}
