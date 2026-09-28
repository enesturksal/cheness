import type { ExplorerResponse } from './types';

/**
 * Two-level cache for explorer responses: an in-memory map for the session plus IndexedDB
 * so positions survive reloads. IndexedDB may be unavailable (private mode, quota); every
 * access is guarded and silently falls back to memory only.
 */
const DB_NAME = 'cheness';
const STORE = 'explorer';
const DB_VERSION = 1;
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const MEMORY_CAP = 400;

interface Entry {
  data: ExplorerResponse;
  ts: number;
}

const memory = new Map<string, Entry>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function idbGet(key: string): Promise<Entry | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) return resolve(null);
        try {
          const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
          req.onsuccess = () => resolve((req.result as Entry | undefined) ?? null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      }),
  );
}

function idbSet(key: string, entry: Entry): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) return resolve();
        try {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(entry, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        } catch {
          resolve();
        }
      }),
  );
}

function fresh(e: Entry | null | undefined): e is Entry {
  return !!e && Date.now() - e.ts < TTL_MS;
}

function remember(key: string, entry: Entry): void {
  if (memory.size >= MEMORY_CAP) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, entry);
}

export async function cacheGet(key: string): Promise<ExplorerResponse | null> {
  const m = memory.get(key);
  if (fresh(m)) return m.data;
  const e = await idbGet(key);
  if (fresh(e)) {
    remember(key, e);
    return e.data;
  }
  return null;
}

export async function cacheSet(key: string, data: ExplorerResponse): Promise<void> {
  const entry = { data, ts: Date.now() };
  remember(key, entry);
  await idbSet(key, entry);
}

/** For tests. */
export function clearMemoryCache(): void {
  memory.clear();
}

// ---- Generic key/value cache (same IndexedDB store, namespaced keys) for other sources ----
const kvMemory = new Map<string, { v: unknown; ts: number }>();

export async function kvGet<T>(key: string): Promise<T | null> {
  const m = kvMemory.get(key);
  if (m && Date.now() - m.ts < TTL_MS) return m.v as T;
  const e = (await idbGet(`kv|${key}`)) as unknown as { v: T; ts: number } | null;
  if (e && Date.now() - e.ts < TTL_MS) {
    kvMemory.set(key, e);
    return e.v;
  }
  return null;
}

export async function kvSet<T>(key: string, v: T): Promise<void> {
  const entry = { v, ts: Date.now() };
  if (kvMemory.size >= MEMORY_CAP) {
    const oldest = kvMemory.keys().next().value;
    if (oldest !== undefined) kvMemory.delete(oldest);
  }
  kvMemory.set(key, entry);
  await idbSet(`kv|${key}`, entry as unknown as Entry);
}
