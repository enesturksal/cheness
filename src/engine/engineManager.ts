import { Engine } from './stockfish';

const ENGINE_PATH = 'stockfish/stockfish-19-lite-single.js';

let botEngine: Engine | null = null;

export function engineUrl(): string {
  // BASE_URL ends with "/" ("/" in dev, "/<repo>/" on GitHub Pages).
  return `${import.meta.env.BASE_URL}${ENGINE_PATH}`;
}

/** Lazily create the shared bot engine. */
export function getEngine(): Engine {
  if (!botEngine) botEngine = new Engine(engineUrl());
  return botEngine;
}

/** Drop the engine (e.g. after a fatal worker error) so the next call recreates it. */
export function resetEngine(): void {
  botEngine?.terminate();
  botEngine = null;
}
