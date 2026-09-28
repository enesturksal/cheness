import { Engine } from './stockfish';

const ENGINE_PATH = 'stockfish/stockfish-19-lite-single.js';

let botEngine: Engine | null = null;
let analysisEngine: Engine | null = null;

export function engineUrl(): string {
  // BASE_URL ends with "/" ("/" in dev, "/<repo>/" on GitHub Pages).
  return `${import.meta.env.BASE_URL}${ENGINE_PATH}`;
}

/** Lazily create the shared bot engine (plays moves at the chosen skill level). */
export function getEngine(): Engine {
  if (!botEngine) botEngine = new Engine(engineUrl());
  return botEngine;
}

/** A second, full-strength instance for move classification, so it never delays the bot. */
export function getAnalysisEngine(): Engine {
  if (!analysisEngine) analysisEngine = new Engine(engineUrl());
  return analysisEngine;
}

/** Drop the engines (e.g. after a fatal worker error) so the next call recreates them. */
export function resetEngines(): void {
  botEngine?.terminate();
  analysisEngine?.terminate();
  botEngine = null;
  analysisEngine = null;
}
