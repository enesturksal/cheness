import { turnOf } from '../game/game';
import type { Score } from './analysis';

/**
 * Lichess cloud evaluations: Stockfish results (often depth 30-60) for positions Lichess has
 * already analysed. Free, no login, CORS enabled; 404 when the position is unknown.
 * Scores in the API are from White's side; we convert to the side to move.
 */
export interface CloudLine {
  uci: string;
  pv: string[];
  score: Score;
}

export interface CloudEval {
  depth: number;
  knodes: number;
  lines: CloudLine[];
}

const ENDPOINT = 'https://lichess.org/api/cloud-eval';
const CACHE_CAP = 800;
const BACKOFF_MS = 60_000;

const cache = new Map<string, { multiPv: number; data: CloudEval | null }>();
let disabledUntil = 0;

function remember(fen: string, multiPv: number, data: CloudEval | null): void {
  if (cache.size >= CACHE_CAP) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(fen, { multiPv, data });
}

export function cloudEvalAvailable(): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return Date.now() >= disabledUntil;
}

export async function fetchCloudEval(
  fen: string,
  multiPv = 2,
  signal?: AbortSignal,
): Promise<CloudEval | null> {
  const hit = cache.get(fen);
  if (hit && (hit.data === null || hit.multiPv >= multiPv)) return hit.data;
  if (!cloudEvalAvailable()) return null;

  let res: Response;
  try {
    const p = new URLSearchParams({ fen, multiPv: String(multiPv) });
    res = await fetch(`${ENDPOINT}?${p.toString()}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch {
    return null; // offline or aborted
  }
  if (res.status === 404) {
    remember(fen, multiPv, null);
    return null;
  }
  if (res.status === 429) {
    disabledUntil = Date.now() + BACKOFF_MS;
    return null;
  }
  if (!res.ok) return null;

  const json = (await res.json()) as {
    depth?: number;
    knodes?: number;
    pvs?: { moves: string; cp?: number; mate?: number }[];
  };
  const black = turnOf(fen) === 'black';
  const lines: CloudLine[] = (json.pvs ?? [])
    .filter((pv) => typeof pv.moves === 'string' && pv.moves.length > 0)
    .map((pv) => {
      const moves = pv.moves.split(' ');
      const cp = typeof pv.cp === 'number' ? (black ? -pv.cp : pv.cp) : null;
      const mate = typeof pv.mate === 'number' ? (black ? -pv.mate : pv.mate) : null;
      return { uci: moves[0], pv: moves, score: { cp, mate } };
    });
  const data: CloudEval = { depth: json.depth ?? 0, knodes: json.knodes ?? 0, lines };
  remember(fen, multiPv, data);
  return data;
}
