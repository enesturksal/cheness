import type { ExplorerMove, ExplorerQuery, ExplorerResponse, OpeningName } from './types';

/** Verified against https://lichess.org/api#tag/Opening-Explorer (Sep 2026). */
export const EXPLORER_HOST = 'https://explorer.lichess.org';

export class ExplorerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ExplorerError';
  }
}

/** Stable cache key for a query. */
export function queryKey(q: ExplorerQuery): string {
  if (q.db === 'masters') return `masters|${q.epd}`;
  return `lichess|${q.epd}|${[...q.ratings].sort((a, b) => a - b).join(',')}|${[...q.speeds].sort().join(',')}`;
}

export function buildUrl(q: ExplorerQuery): string {
  const p = new URLSearchParams();
  p.set('fen', q.epd);
  p.set('moves', String(q.moves ?? 12));
  // We only need aggregated move stats; game lists would just inflate the payload.
  p.set('topGames', '0');
  if (q.db === 'lichess') {
    p.set('variant', 'standard');
    p.set('recentGames', '0');
    if (q.speeds.length) p.set('speeds', q.speeds.join(','));
    if (q.ratings.length) p.set('ratings', q.ratings.join(','));
  }
  return `${EXPLORER_HOST}/${q.db}?${p.toString()}`;
}

function asInt(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0;
}

function asOpening(v: unknown): OpeningName | null {
  if (v && typeof v === 'object' && 'name' in v && 'eco' in v) {
    const o = v as { eco: unknown; name: unknown };
    return { eco: String(o.eco), name: String(o.name) };
  }
  return null;
}

/** Pick only the fields we use and coerce types defensively. */
export function normalize(raw: unknown): ExplorerResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const movesRaw = Array.isArray(r.moves) ? (r.moves as Record<string, unknown>[]) : [];
  const moves: ExplorerMove[] = movesRaw
    .filter((m) => typeof m.uci === 'string' && typeof m.san === 'string')
    .map((m) => ({
      uci: m.uci as string,
      san: m.san as string,
      white: asInt(m.white),
      draws: asInt(m.draws),
      black: asInt(m.black),
      averageRating: m.averageRating == null ? null : asInt(m.averageRating),
      opening: asOpening(m.opening),
    }));
  return {
    white: asInt(r.white),
    draws: asInt(r.draws),
    black: asInt(r.black),
    moves,
    opening: asOpening(r.opening),
  };
}

/** The explorer requires a Lichess token (OAuth or personal API token) since mid-2026. */
export async function fetchExplorer(
  q: ExplorerQuery,
  signal?: AbortSignal,
  token?: string | null,
): Promise<ExplorerResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(buildUrl(q), { signal, headers });
  if (!res.ok) throw new ExplorerError(res.status, `Explorer HTTP ${res.status}`);
  return normalize(await res.json());
}

export interface Outcome {
  white: number;
  draws: number;
  black: number;
}

export function total(o: Outcome): number {
  return o.white + o.draws + o.black;
}

/** Win/draw/loss shares in percent (they sum to ~100; each rounded to 1 decimal). */
export function outcomePercents(o: Outcome): Outcome {
  const t = total(o);
  if (t === 0) return { white: 0, draws: 0, black: 0 };
  const r = (n: number) => Math.round((n / t) * 1000) / 10;
  return { white: r(o.white), draws: r(o.draws), black: r(o.black) };
}

/** Share of a move among all games in the position, in percent (1 decimal). */
export function movePercent(move: Outcome, position: Outcome): number {
  const t = total(position);
  if (t === 0) return 0;
  return Math.round((total(move) / t) * 1000) / 10;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 100_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
