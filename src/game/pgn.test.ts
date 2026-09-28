import { describe, expect, it } from 'vitest';
import { describeHeaders, lichessGameId, parsePgn } from './pgn';

const chesscomPgn = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.09.20"]
[White "alice"]
[Black "bob"]
[Result "1-0"]
[WhiteElo "1043"]
[BlackElo "998"]
[TimeControl "600"]
[ECO "C50"]

1. e4 {[%clk 0:09:58.9]} 1... e5 {[%clk 0:09:57.1]} 2. Nf3 {[%clk 0:09:55]} 2... Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 1-0`;

const lichessPgn = `[Event "Rated Blitz game"]
[Site "https://lichess.org/abcd1234"]
[White "carol"]
[Black "dave"]
[Result "0-1"]
[Variant "Standard"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 0-1`;

describe('pgn import', () => {
  it('reads chess.com exports with clock comments', () => {
    const g = parsePgn(chesscomPgn);
    expect(g.moves.slice(0, 4)).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6']);
    expect(g.moves).toHaveLength(10);
    expect(g.headers.White).toBe('alice');
    expect(describeHeaders(g.headers)).toBe('alice (1043) – bob (998) · 1-0');
  });

  it('reads lichess exports and bare movetext', () => {
    expect(parsePgn(lichessPgn).moves).toHaveLength(10);
    expect(parsePgn('1. e4 c5 2. Nf3 d6').moves).toEqual(['e2e4', 'c7c5', 'g1f3', 'd7d6']);
  });

  it('rejects junk', () => {
    expect(() => parsePgn('')).toThrow();
    expect(() => parsePgn('1. e4 e5 2. Ke2 Qh4 3. Kd3 Nc6 4. Kc4 Qxe4')).not.toThrow();
    expect(() => parsePgn('hello world')).toThrow();
  });

  it('extracts lichess game ids', () => {
    expect(lichessGameId('https://lichess.org/abcd1234')).toBe('abcd1234');
    expect(lichessGameId('https://lichess.org/abcd1234wxyz/black#12')).toBe('abcd1234');
    expect(lichessGameId('lichess.org/embed/abcd1234')).toBe('abcd1234');
    expect(lichessGameId('abcd1234')).toBe('abcd1234');
    expect(lichessGameId('https://www.chess.com/game/live/1')).toBeNull();
  });
});
