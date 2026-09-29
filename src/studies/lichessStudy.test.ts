import { describe, expect, it } from 'vitest';
import { START_FEN } from '../game/game';
import { parseStudyPgn, posKey, splitCommentTags, studyIdFrom } from './lichessStudy';

const pgn = `[Event "Test Study: Intro"]
[Result "*"]
[StudyName "Test Study"]
[ChapterName "Intro"]
[ChapterURL "https://lichess.org/study/abcd1234/xyz"]
[Annotator "https://lichess.org/@/someone"]
[ChapterMode "gamebook"]

{ Welcome. Play 1.e4 } { [%cal Ge2e4] }
1. e4 { Good. [%csl Gc5][%cal Gc7c5] } 1... c5 (1... e5 { another }) 2. Nf3 { Main } *


[Event "Test Study: Chapter 2"]
[StudyName "Test Study"]
[ChapterName "Chapter 2"]
[FEN "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"]
[SetUp "1"]

2. Nf3 { From a custom position } d6 *`;

describe('lichess studies', () => {
  it('extracts ids from urls', () => {
    expect(studyIdFrom('https://lichess.org/study/jsSks17H')).toBe('jsSks17H');
    expect(studyIdFrom('https://lichess.org/study/jsSks17H/maM1rZ5F')).toBe('jsSks17H');
    expect(studyIdFrom('jsSks17H')).toBe('jsSks17H');
    expect(studyIdFrom('https://lichess.org/abcd1234')).toBeNull();
  });

  it('splits arrows and squares out of comments', () => {
    const { text, shapes } = splitCommentTags(
      'Go here [%cal Ge2e4,Rd2d4] [%csl Yc5] [%clk 0:01:00]',
    );
    expect(text).toBe('Go here');
    expect(shapes).toEqual([
      { orig: 'e2', dest: 'e4', brush: 'green' },
      { orig: 'd2', dest: 'd4', brush: 'red' },
      { orig: 'c5', brush: 'yellow' },
    ]);
  });

  it('parses chapters, comments per position, shapes and custom start positions', () => {
    const s = parseStudyPgn('abcd1234', pgn);
    expect(s.name).toBe('Test Study');
    expect(s.author).toBe('someone');
    expect(s.chapters).toHaveLength(2);
    const ch = s.chapters[0];
    expect(ch.mode).toBe('gamebook');
    expect(ch.moves).toEqual(['e2e4', 'c7c5', 'g1f3']);
    expect(ch.comments[posKey(START_FEN)]).toBe('Welcome. Play 1.e4');
    expect(ch.shapes[posKey(START_FEN)]).toEqual([{ orig: 'e2', dest: 'e4', brush: 'green' }]);
    const afterE4 = posKey('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    expect(ch.comments[afterE4]).toBe('Good.');
    expect(ch.shapes[afterE4]).toHaveLength(2);
    expect(s.chapters[1].startFen).toBe(
      'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    );
    expect(s.chapters[1].moves).toEqual(['g1f3', 'd7d6']);
  });
});
