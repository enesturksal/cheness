/**
 * Thin UCI wrapper around the single-threaded Stockfish WASM build running in a Web Worker.
 * The worker script (public/stockfish/stockfish-19-lite-single.js) speaks plain UCI over
 * postMessage: every string we post is a command, every message we receive is an output line.
 */
export type LineListener = (line: string) => void;

export interface SearchOptions {
  /** UCI Skill Level 0-20. */
  skill: number;
  depth?: number;
  /** Milliseconds. */
  movetime?: number;
}

export interface SearchResult {
  bestmove: string | null;
  ponder?: string;
}

/** One principal variation from a UCI `info` line (scores from the side to move). */
export interface EvalLine {
  multipv: number;
  cp: number | null;
  mate: number | null;
  depth: number;
  pv: string[];
}

export interface Evaluation {
  /** Lines ordered by multipv (1 = best). */
  lines: EvalLine[];
  bestmove: string | null;
  /** Depth reached by the main line. */
  depth: number;
}

export class Engine {
  private worker: Worker;
  private listeners = new Set<LineListener>();
  private queue: Promise<unknown> = Promise.resolve();
  private searching = false;
  readonly ready: Promise<void>;

  constructor(scriptUrl: string) {
    this.worker = new Worker(scriptUrl);
    this.worker.onmessage = (e: MessageEvent) => {
      const data = typeof e.data === 'string' ? e.data : String(e.data ?? '');
      for (const line of data.split('\n')) if (line) this.emit(line.trimEnd());
    };
    this.ready = this.init();
  }

  private emit(line: string): void {
    for (const l of this.listeners) l(line);
  }

  private async init(): Promise<void> {
    const uciok = this.waitFor((l) => l === 'uciok', 60_000);
    this.send('uci');
    await uciok;
    const readyok = this.waitFor((l) => l === 'readyok', 60_000);
    this.send('isready');
    await readyok;
  }

  onLine(fn: LineListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  send(cmd: string): void {
    this.worker.postMessage(cmd);
  }

  private waitFor(pred: (line: string) => boolean, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error('engine timeout'));
      }, timeoutMs);
      const off = this.onLine((line) => {
        if (pred(line)) {
          clearTimeout(timer);
          off();
          resolve(line);
        }
      });
    });
  }

  /** Serialize searches: a new request stops the running one and waits for it to finish. */
  private enqueue<T>(run: () => Promise<T>): Promise<T> {
    if (this.searching) this.send('stop');
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  /** Ask for a move at the given strength. Resolves with null when there is no legal move. */
  bestMove(fen: string, opts: SearchOptions): Promise<SearchResult> {
    return this.enqueue(async () => {
      await this.ready;
      this.send(`setoption name Skill Level value ${clamp(opts.skill, 0, 20)}`);
      this.send('setoption name MultiPV value 1');
      this.send(`position fen ${fen}`);
      const go = ['go'];
      if (opts.depth) go.push('depth', String(opts.depth));
      if (opts.movetime) go.push('movetime', String(opts.movetime));
      this.searching = true;
      const done = this.waitFor(
        (l) => l.startsWith('bestmove'),
        (opts.movetime ?? 10_000) + 20_000,
      );
      this.send(go.join(' '));
      try {
        return parseBestmove(await done);
      } finally {
        this.searching = false;
      }
    });
  }

  /**
   * Full-strength evaluation to a fixed depth, for move classification. With `multiPv > 1`
   * the runner-up lines are returned too (needed to tell "great" moves from merely best ones).
   */
  evaluate(fen: string, depth: number, multiPv = 1): Promise<Evaluation> {
    return this.enqueue(async () => {
      await this.ready;
      this.send('setoption name Skill Level value 20');
      this.send(`setoption name MultiPV value ${clamp(multiPv, 1, 5)}`);
      this.send(`position fen ${fen}`);
      const lines = new Map<number, EvalLine>();
      let depthReached = 0;
      const off = this.onLine((line) => {
        const info = parseInfo(line, true);
        if (!info) return;
        const idx = info.multipv ?? 1;
        const d = info.depth ?? 0;
        const prev = lines.get(idx);
        if (!prev || d >= prev.depth) {
          lines.set(idx, {
            multipv: idx,
            cp: info.cp ?? null,
            mate: info.mate ?? null,
            depth: d,
            pv: info.pv ?? [],
          });
        }
        if (idx === 1) depthReached = Math.max(depthReached, d);
      });
      this.searching = true;
      const done = this.waitFor((l) => l.startsWith('bestmove'), 120_000);
      this.send(`go depth ${depth}`);
      try {
        const { bestmove } = parseBestmove(await done);
        return {
          lines: [...lines.values()].sort((a, b) => a.multipv - b.multipv),
          bestmove,
          depth: depthReached,
        };
      } finally {
        off();
        this.searching = false;
      }
    });
  }

  stop(): void {
    if (this.searching) this.send('stop');
  }

  newGame(): void {
    this.send('ucinewgame');
  }

  terminate(): void {
    this.worker.terminate();
    this.listeners.clear();
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function parseBestmove(line: string): SearchResult {
  const parts = line.trim().split(/\s+/);
  const bm = parts[1];
  const ponderIdx = parts.indexOf('ponder');
  return {
    bestmove: bm && bm !== '(none)' ? bm : null,
    ponder: ponderIdx > 0 ? parts[ponderIdx + 1] : undefined,
  };
}

export interface InfoLine {
  depth: number;
  cp: number | null;
  mate: number | null;
  pv: string[];
  /** Only present for secondary lines (multipv >= 2). */
  multipv?: number;
}

/**
 * Parse a UCI `info` line carrying a score. Returns null for other lines, and for
 * multipv > 1 lines unless `allowMultiPv` is set.
 */
export function parseInfo(line: string, allowMultiPv = false): Partial<InfoLine> | null {
  if (!line.startsWith('info ') || !line.includes(' score ')) return null;
  const parts = line.trim().split(/\s+/);
  const out: Partial<InfoLine> = {};
  const mpv = parts.indexOf('multipv');
  if (mpv > 0 && parts[mpv + 1] !== '1') {
    if (!allowMultiPv) return null;
    out.multipv = Number(parts[mpv + 1]);
  }
  const d = parts.indexOf('depth');
  if (d > 0) out.depth = Number(parts[d + 1]);
  const s = parts.indexOf('score');
  if (s > 0) {
    const kind = parts[s + 1];
    const val = Number(parts[s + 2]);
    if (kind === 'cp') {
      out.cp = val;
      out.mate = null;
    } else if (kind === 'mate') {
      out.mate = val;
      out.cp = null;
    }
  }
  const pv = parts.indexOf('pv');
  if (pv > 0) out.pv = parts.slice(pv + 1);
  return out;
}
