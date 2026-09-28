import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchChessDb } from './chessdb';

const fen = 'rnbqkbnr/pppp1ppp/8/4p3/5PP1/8/PPPPP2P/RNBQKBNR b KQkq - 0 3';

describe('chessdb client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('parses moves, mate scores and win rates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          moves: [
            { uci: 'd8h4', san: 'Qh4#', score: 29999, rank: 2, note: '!' },
            { uci: 'd7d5', san: 'd5', score: 254, rank: 0, winrate: '68.35' },
          ],
        }),
      })),
    );
    const moves = await fetchChessDb(fen);
    expect(moves).toHaveLength(2);
    expect(moves![0].score).toEqual({ cp: null, mate: 1 });
    expect(moves![1].score).toEqual({ cp: 254, mate: null });
    expect(moves![1].winrate).toBe(68.35);
  });

  it('returns null (and caches it) for unknown positions', async () => {
    const f = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: 'unknown' }),
    }));
    vi.stubGlobal('fetch', f);
    const other = '8/8/8/8/8/8/8/k6K w - - 0 1';
    expect(await fetchChessDb(other)).toBeNull();
    expect(await fetchChessDb(other)).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
  });
});
