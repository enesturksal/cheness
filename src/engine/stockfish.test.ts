import { describe, expect, it } from 'vitest';
import { parseBestmove, parseInfo } from './stockfish';

describe('uci parsing', () => {
  it('parses bestmove lines', () => {
    expect(parseBestmove('bestmove e2e4 ponder e7e5')).toEqual({
      bestmove: 'e2e4',
      ponder: 'e7e5',
    });
    expect(parseBestmove('bestmove g1f3')).toEqual({ bestmove: 'g1f3', ponder: undefined });
    expect(parseBestmove('bestmove (none)').bestmove).toBeNull();
  });

  it('parses info lines with cp and mate scores', () => {
    const cp = parseInfo(
      'info depth 12 seldepth 18 multipv 1 score cp 35 nodes 1000 pv e2e4 e7e5 g1f3',
    );
    expect(cp).toEqual({ depth: 12, cp: 35, mate: null, pv: ['e2e4', 'e7e5', 'g1f3'] });
    const mate = parseInfo('info depth 20 score mate -3 pv h7h5');
    expect(mate?.mate).toBe(-3);
    expect(mate?.cp).toBeNull();
  });

  it('ignores irrelevant lines and secondary pvs', () => {
    expect(parseInfo('info string NNUE evaluation using nn.nnue')).toBeNull();
    expect(parseInfo('info depth 5 multipv 2 score cp -10 pv a2a3')).toBeNull();
    expect(parseInfo('readyok')).toBeNull();
  });
});
