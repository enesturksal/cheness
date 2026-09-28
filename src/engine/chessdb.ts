/**
 * ChessDB (chessdb.cn, "Chess Cloud Database"): engine scores for billions of positions,
 * free, CORS enabled. Scores are centipawns from the side to move.
 */
import type { Score } from './analysis';

export interface ChessDbMove {
  uci: string;
  san: string;
  score: Score;
  /** Win rate in percent for the side to move, when known. */
  winrate: number | null;
}

const ENDPOINT = 'https://www.chessdb.cn/cdb.php';
const CACHE_CAP = 500;
const cache = new Map<string, ChessDbMove[] | null>();
let disabledUntil = 0;

function remember(fen: string, v: ChessDbMove[] | null): void {
  if (cache.size >= CACHE_CAP) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(fen, v);
}

function toScore(raw: number): Score {
  // ChessDB encodes mates as +-(30000 - n)
  if (Math.abs(raw) >= 29000) {
    const n = 30000 - Math.abs(raw);
    return { cp: null, mate: raw > 0 ? n : -n };
  }
  return { cp: raw, mate: null };
}

export async function fetchChessDb(
  fen: string,
  signal?: AbortSignal,
): Promise<ChessDbMove[] | null> {
  if (cache.has(fen)) return cache.get(fen) ?? null;
  if (Date.now() < disabledUntil) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  let res: Response;
  try {
    const p = new URLSearchParams({ action: 'queryall', board: fen, json: '1' });
    res = await fetch(`${ENDPOINT}?${p.toString()}`, { signal });
  } catch {
    return null;
  }
  if (res.status === 429) {
    disabledUntil = Date.now() + 60_000;
    return null;
  }
  if (!res.ok) return null;
  const json = (await res.json()) as {
    status?: string;
    moves?: { uci: string; san: string; score: number; winrate?: string }[];
  };
  if (json.status !== 'ok' || !Array.isArray(json.moves) || json.moves.length === 0) {
    remember(fen, null);
    return null;
  }
  const moves = json.moves
    .filter((m) => typeof m.uci === 'string' && typeof m.score === 'number')
    .map((m) => ({
      uci: m.uci,
      san: m.san,
      score: toScore(m.score),
      winrate: m.winrate ? Number(m.winrate) : null,
    }));
  remember(fen, moves);
  return moves;
}
