/**
 * Curated "most played" openings for the Openings screen, by family name as it appears in
 * lichess-org/chess-openings. `line` is the family's main line in UCI, `reply` marks which
 * first move a Black opening answers (used for popularity lookups in the explorer).
 */
export interface PopularOpening {
  family: string;
  eco: string;
  line: string[];
  /** For Black openings: the White first move it answers. */
  reply?: 'e2e4' | 'd2d4';
}

export const POPULAR_WHITE: PopularOpening[] = [
  { family: 'Italian Game', eco: 'C50', line: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'] },
  { family: 'Ruy Lopez', eco: 'C60', line: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'] },
  { family: 'Scotch Game', eco: 'C45', line: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4'] },
  { family: 'Vienna Game', eco: 'C25', line: ['e2e4', 'e7e5', 'b1c3'] },
  { family: "King's Gambit", eco: 'C30', line: ['e2e4', 'e7e5', 'f2f4'] },
  { family: "Queen's Gambit", eco: 'D06', line: ['d2d4', 'd7d5', 'c2c4'] },
  { family: 'London System', eco: 'D02', line: ['d2d4', 'd7d5', 'g1f3', 'g8f6', 'c1f4'] },
  { family: 'Catalan Opening', eco: 'E00', line: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g2g3'] },
  { family: 'Trompowsky Attack', eco: 'A45', line: ['d2d4', 'g8f6', 'c1g5'] },
  { family: 'English Opening', eco: 'A10', line: ['c2c4'] },
  { family: 'Réti Opening', eco: 'A05', line: ['g1f3', 'd7d5', 'c2c4'] },
  { family: "King's Indian Attack", eco: 'A07', line: ['g1f3', 'd7d5', 'g2g3'] },
];

export const POPULAR_BLACK: PopularOpening[] = [
  { family: 'Sicilian Defense', eco: 'B20', line: ['e2e4', 'c7c5'], reply: 'e2e4' },
  { family: 'French Defense', eco: 'C00', line: ['e2e4', 'e7e6'], reply: 'e2e4' },
  { family: 'Caro-Kann Defense', eco: 'B10', line: ['e2e4', 'c7c6'], reply: 'e2e4' },
  { family: "Petrov's Defense", eco: 'C42', line: ['e2e4', 'e7e5', 'g1f3', 'g8f6'], reply: 'e2e4' },
  { family: 'Scandinavian Defense', eco: 'B01', line: ['e2e4', 'd7d5'], reply: 'e2e4' },
  { family: 'Pirc Defense', eco: 'B07', line: ['e2e4', 'd7d6', 'd2d4', 'g8f6'], reply: 'e2e4' },
  { family: 'Modern Defense', eco: 'B06', line: ['e2e4', 'g7g6'], reply: 'e2e4' },
  { family: 'Alekhine Defense', eco: 'B02', line: ['e2e4', 'g8f6'], reply: 'e2e4' },
  {
    family: "King's Indian Defense",
    eco: 'E60',
    line: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3'],
    reply: 'd2d4',
  },
  {
    family: 'Nimzo-Indian Defense',
    eco: 'E20',
    line: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'b1c3', 'f8b4'],
    reply: 'd2d4',
  },
  {
    family: "Queen's Gambit Declined",
    eco: 'D30',
    line: ['d2d4', 'd7d5', 'c2c4', 'e7e6'],
    reply: 'd2d4',
  },
  { family: 'Slav Defense', eco: 'D10', line: ['d2d4', 'd7d5', 'c2c4', 'c7c6'], reply: 'd2d4' },
  {
    family: 'Grünfeld Defense',
    eco: 'D80',
    line: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'd7d5'],
    reply: 'd2d4',
  },
  { family: 'Dutch Defense', eco: 'A80', line: ['d2d4', 'f7f5'], reply: 'd2d4' },
  { family: 'Benoni Defense', eco: 'A60', line: ['d2d4', 'g8f6', 'c2c4', 'c7c5'], reply: 'd2d4' },
  {
    family: 'Benko Gambit',
    eco: 'A57',
    line: ['d2d4', 'g8f6', 'c2c4', 'c7c5', 'd4d5', 'b7b5'],
    reply: 'd2d4',
  },
];
