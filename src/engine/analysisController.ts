import { lookupEpd } from '../explorer/book';
import { fenAt, sanFromUci, statusOf } from '../game/game';
import { useStore } from '../store/useStore';
import { classify, negateScore, type MoveAnnotation, type Score } from './analysis';
import { fetchCloudEval } from './cloudEval';
import { getAnalysisEngine } from './engineManager';

const DEBOUNCE_MS = 300;
const CACHE_CAP = 600;

interface PositionEval {
  lines: { uci: string; score: Score }[];
  bestmove: string | null;
  depth: number;
}

/** Local evaluations keyed by `fen|depth`; a position is analysed once and reused for both plies it touches. */
const evalCache = new Map<string, PositionEval>();

function remember(key: string, value: PositionEval): void {
  if (evalCache.size >= CACHE_CAP) {
    const oldest = evalCache.keys().next().value;
    if (oldest !== undefined) evalCache.delete(oldest);
  }
  evalCache.set(key, value);
}

async function evaluateLocal(fen: string, depth: number): Promise<PositionEval> {
  const key = `${fen}|${depth}`;
  const hit = evalCache.get(key);
  if (hit) return hit;
  const ev = await getAnalysisEngine().evaluate(fen, depth, 2);
  const result: PositionEval = {
    lines: ev.lines.map((l) => ({ uci: l.pv[0] ?? '', score: { cp: l.cp, mate: l.mate } })),
    bestmove: ev.bestmove,
    depth: ev.depth,
  };
  // A search that was stopped early must not be cached as if it reached the target depth.
  if (result.depth >= depth || result.lines.length === 0) remember(key, result);
  return result;
}

async function evaluateCloud(fen: string): Promise<PositionEval | null> {
  if (statusOf(fen).over) return { lines: [], bestmove: null, depth: 0 };
  const c = await fetchCloudEval(fen, 2);
  if (!c || c.lines.length === 0) return null;
  return {
    lines: c.lines.map((l) => ({ uci: l.uci, score: l.score })),
    bestmove: c.lines[0].uci,
    depth: c.depth,
  };
}

/**
 * Evaluate the positions before and after a move with a single source, so the two scores are
 * comparable: Lichess cloud evals for both when both exist, otherwise the local engine for both.
 */
async function evaluatePair(
  beforeFen: string,
  afterFen: string,
  depth: number,
  useCloud: boolean,
): Promise<{ before: PositionEval; after: PositionEval; source: 'cloud' | 'engine' }> {
  if (useCloud) {
    const [cb, ca] = await Promise.all([evaluateCloud(beforeFen), evaluateCloud(afterFen)]);
    if (cb && ca) return { before: cb, after: ca, source: 'cloud' };
  }
  const before = await evaluateLocal(beforeFen, depth);
  const after = await evaluateLocal(afterFen, depth);
  return { before, after, source: 'engine' };
}

/** Score of the position after a move, from the mover's perspective. */
function afterScore(afterFen: string, ev: PositionEval): Score {
  const st = statusOf(afterFen);
  if (st.over) {
    if (st.reason === 'checkmate') return { cp: null, mate: 1 };
    return { cp: 0, mate: null };
  }
  const line = ev.lines[0];
  if (!line) return { cp: 0, mate: null };
  return negateScore(line.score);
}

/**
 * Annotates every played move with the engine's verdict, most recent (and currently viewed)
 * plies first. Runs on its own engine instance and re-checks the store between steps so a
 * new game or a branch simply redirects the work. Returns a disposer.
 */
export function startAnalysisController(): () => void {
  const store = useStore;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let generation = 0;

  const nextPending = (): number | null => {
    const s = store.getState();
    const depth = s.analysisDepth;
    if (!depth) return null;
    const { moves, ply } = s.game;
    const order = [ply - 1, moves.length - 1];
    for (let i = moves.length - 1; i >= 0; i--) order.push(i);
    for (const i of order) {
      if (i < 0 || i >= moves.length) continue;
      const a = s.annotations[i];
      if (!a || a.uci !== moves[i].uci || (a.source !== 'cloud' && a.depth < depth)) return i;
    }
    return null;
  };

  const loop = async () => {
    if (running) return;
    running = true;
    const gen = ++generation;
    try {
      for (;;) {
        const i = nextPending();
        if (i === null) break;
        const s = store.getState();
        const depth = s.analysisDepth;
        const game = s.game;
        const move = game.moves[i];
        const beforeFen = fenAt(game, i);

        const { before, after, source } = await evaluatePair(
          beforeFen,
          move.fen,
          depth,
          s.useCloudEval,
        );
        if (gen !== generation) break;

        const cur = store.getState();
        if (cur.game.moves[i]?.uci !== move.uci || cur.analysisDepth !== depth) continue;

        const bestLine = before.lines[0];
        const bestMove = before.bestmove ?? bestLine?.uci ?? null;
        const beforeScore: Score = bestLine?.score ?? { cp: 0, mate: null };
        const afterSc = afterScore(move.fen, after);
        const { kind, loss } = classify({
          uci: move.uci,
          bestMove,
          before: beforeScore,
          secondBest: before.lines[1]?.score ?? null,
          after: afterSc,
          inBook: !!lookupEpd(move.epd),
        });
        const ann: MoveAnnotation = {
          uci: move.uci,
          kind,
          bestMove,
          bestSan: bestMove ? (sanFromUci(beforeFen, bestMove) ?? undefined) : undefined,
          before: beforeScore,
          after: afterSc,
          loss,
          depth:
            source === 'cloud'
              ? Math.max(depth, Math.min(before.depth, after.depth || before.depth))
              : Math.min(before.depth, after.depth) || depth,
          source,
        };
        cur.setAnnotation(i, ann);
      }
    } catch (err) {
      console.warn('move analysis failed', err);
    } finally {
      running = false;
    }
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void loop(), DEBOUNCE_MS);
  };

  const unsubscribe = store.subscribe((s, prev) => {
    if (
      s.game !== prev.game ||
      s.analysisDepth !== prev.analysisDepth ||
      s.useCloudEval !== prev.useCloudEval
    ) {
      schedule();
    }
  });
  schedule();

  return () => {
    generation++;
    unsubscribe();
    clearTimeout(timer);
  };
}
