/**
 * Popular public Lichess opening studies (community lessons). Ids were taken from the
 * authors' public study lists; content is fetched on demand and always credited/linked.
 */
import type { StudyRef } from '../studies/lichessStudy';

export interface CuratedStudy extends StudyRef {
  /** Rough topic for grouping. */
  topic: 'general' | 'e4' | 'd4' | 'black' | 'traps';
}

export const CURATED_STUDIES: CuratedStudy[] = [
  { id: 'ygVnJzbX', name: 'Opening Principles', author: 'LeninPerez', topic: 'general' },
  { id: 'bbxmDYZV', name: 'What is your Ideal Opening?', author: 'LeninPerez', topic: 'general' },
  { id: 'uP2C7ydM', name: "White's 1st Move", author: 'Toxenory', topic: 'general' },
  { id: 'ukwbc1Fn', name: "Black's 1st Move", author: 'Toxenory', topic: 'general' },
  { id: '4JQtS6iu', name: 'Repertoire for 1.e4 players', author: 'LeninPerez', topic: 'e4' },
  { id: 'vJsZScnC', name: 'Italian Opening', author: 'LeninPerez', topic: 'e4' },
  { id: 'tWdyPaE7', name: 'The Italian Game', author: 'heyucatchthis', topic: 'e4' },
  { id: 'gh59AF8V', name: 'The Giuoco Piano', author: 'francesco_super', topic: 'e4' },
  { id: 'ZkCxh0nB', name: 'Ruy Lopez', author: 'LeninPerez', topic: 'e4' },
  { id: 'uSxIUsS3', name: 'Ruy Lopez', author: 'heyucatchthis', topic: 'e4' },
  { id: 'emgikEGQ', name: 'Scotch Game', author: 'heyucatchthis', topic: 'e4' },
  { id: 'SZJNJCKC', name: "The King's Gambit", author: 'francesco_super', topic: 'e4' },
  { id: 'AsIsKPrX', name: 'Anti-Sicilians Repertoire', author: 'FunnyAnimatorJimTV', topic: 'e4' },
  { id: 'vIEKP8t3', name: 'The London System', author: 'LeninPerez', topic: 'd4' },
  { id: 'YFApJGff', name: 'Pawn Structure: London System', author: 'LeninPerez', topic: 'd4' },
  { id: 'BXkDd521', name: "The Queen's Gambit", author: 'francesco_super', topic: 'd4' },
  { id: 'f1uAeXCD', name: 'Réti Opening (1.Nf3)', author: 'FunnyAnimatorJimTV', topic: 'd4' },
  { id: 'HoWpNBCT', name: 'Nimzo-Larsen Attack (1.b3)', author: 'Toxenory', topic: 'd4' },
  { id: 'jsSks17H', name: 'Sicilian Defense', author: 'LeninPerez', topic: 'black' },
  {
    id: '8c8bmUfy',
    name: 'All about the Sicilian Defense',
    author: 'francesco_super',
    topic: 'black',
  },
  { id: 'YcFtDNCn', name: 'Sicilian Najdorf', author: 'francesco_super', topic: 'black' },
  { id: 'jtlLwUvh', name: 'Caro-Kann Defense', author: 'LeninPerez', topic: 'black' },
  { id: 'Sw1lC13A', name: 'The Caro-Kann Defense', author: 'heyucatchthis', topic: 'black' },
  { id: 'UzKIIAtz', name: 'French Defense', author: 'LeninPerez', topic: 'black' },
  { id: 'lWGZ69Ps', name: 'The French Defense', author: 'francesco_super', topic: 'black' },
  { id: 'OnPMlzHT', name: 'Petrov Defense', author: 'LeninPerez', topic: 'black' },
  { id: 'mr9g4cVe', name: 'How to play against 1.e4', author: 'EricRosen', topic: 'black' },
  { id: 'RyMmCrx8', name: 'How to play against 1.d4', author: 'EricRosen', topic: 'black' },
  { id: 'rlgqOaZK', name: "King's Indian Defense", author: 'LeninPerez', topic: 'black' },
  { id: '4HN6lhFd', name: "The King's Indian Defense", author: 'heyucatchthis', topic: 'black' },
  {
    id: 'ZA3ZdCdm',
    name: 'All about the Nimzo-Indian Defense',
    author: 'francesco_super',
    topic: 'black',
  },
  { id: 'pdoTyqq4', name: 'The Slav Defense', author: 'heyucatchthis', topic: 'black' },
  { id: 'MCaFkSdO', name: 'Best replies to d4', author: 'heyucatchthis', topic: 'black' },
  { id: 'Of3mcPk8', name: 'Opening Traps', author: 'Toxenory', topic: 'traps' },
  { id: 'Iaef8Vtb', name: 'Traps: Italian Opening', author: 'LeninPerez', topic: 'traps' },
  { id: '81wPrgEs', name: 'Trap in the Ruy Lopez', author: 'francesco_super', topic: 'traps' },
  { id: 'EjrhlUIa', name: "O'Sullivan Gambit", author: 'EricRosen', topic: 'traps' },
];
