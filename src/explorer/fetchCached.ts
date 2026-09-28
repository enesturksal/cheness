import { fetchExplorer, queryKey } from './api';
import { cacheGet, cacheSet } from './cache';
import type { ExplorerQuery, ExplorerResponse } from './types';

/** Cache-first explorer lookup for one-off queries (e.g. the Openings screen). */
export async function fetchExplorerCached(
  q: ExplorerQuery,
  token: string | null,
  signal?: AbortSignal,
): Promise<ExplorerResponse | null> {
  const key = queryKey(q);
  const cached = await cacheGet(key);
  if (cached) return cached;
  if (!token) return null;
  try {
    const data = await fetchExplorer(q, signal, token);
    void cacheSet(key, data);
    return data;
  } catch {
    return null;
  }
}
