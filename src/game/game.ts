import { Chess, type Move, type Square } from 'chess.js';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type Color = 'white' | 'black';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

/** One played move plus the position it leads to. */
export interface MoveRecord {
  san: string;
  uci: string;
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
  color: Color;
  /** FEN after the move. */
  fen: string;
  /** EPD (FEN without move counters) after the move; used for opening lookups. */
  epd: string;
  check: boolean;
}

/**
 * Linear game history with a cursor. `ply` is how many of `moves` are applied in the
 * currently viewed position (0 = start position). Playing a move while `ply < moves.length`
 * discards the future (no variation tree in the MVP).
 */
export interface GameState {
  startFen: string;
  moves: MoveRecord[];
  ply: number;
}

export interface GameStatus {
  over: boolean;
  result?: '1-0' | '0-1' | '1/2-1/2';
  reason?: 'checkmate' | 'stalemate' | 'insufficient' | 'threefold' | 'fiftyMoves';
  check: boolean;
  turn: Color;
}

export function toEpd(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

export function turnOf(fen: string): Color {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

export function opposite(c: Color): Color {
  return c === 'white' ? 'black' : 'white';
}

export function moveNumberOf(fen: string): number {
  return Number(fen.split(' ')[5] ?? '1');
}

export function newGame(startFen: string = START_FEN): GameState {
  return { startFen, moves: [], ply: 0 };
}

export function fenAt(g: GameState, ply: number): string {
  if (ply <= 0) return g.startFen;
  return g.moves[Math.min(ply, g.moves.length) - 1].fen;
}

export function currentFen(g: GameState): string {
  return fenAt(g, g.ply);
}

export function currentEpd(g: GameState): string {
  return toEpd(currentFen(g));
}

export function atTip(g: GameState): boolean {
  return g.ply === g.moves.length;
}

export function lastMoveSquares(g: GameState): [Square, Square] | undefined {
  if (g.ply === 0) return undefined;
  const m = g.moves[g.ply - 1];
  return [m.from, m.to];
}

export function legalMoves(fen: string): Move[] {
  return new Chess(fen).moves({ verbose: true });
}

/** Legal destinations per origin square, in the shape chessground expects. */
export function destsFor(fen: string): Map<Square, Square[]> {
  const dests = new Map<Square, Square[]>();
  for (const m of legalMoves(fen)) {
    const list = dests.get(m.from);
    if (list) {
      if (!list.includes(m.to)) list.push(m.to);
    } else dests.set(m.from, [m.to]);
  }
  return dests;
}

export function moveToUci(m: Move): string {
  return m.from + m.to + (m.promotion ?? '');
}

export function parseUci(uci: string): { from: Square; to: Square; promotion?: PromotionPiece } {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: (uci[4] as PromotionPiece | undefined) || undefined,
  };
}

export function isPromotionMove(fen: string, from: Square, to: Square): boolean {
  return legalMoves(fen).some((m) => m.from === from && m.to === to && m.promotion !== undefined);
}

function record(chess: Chess, m: Move): MoveRecord {
  const fen = chess.fen();
  return {
    san: m.san,
    uci: moveToUci(m),
    from: m.from,
    to: m.to,
    promotion: m.promotion as PromotionPiece | undefined,
    color: m.color === 'w' ? 'white' : 'black',
    fen,
    epd: toEpd(fen),
    check: chess.inCheck(),
  };
}

/** Play a UCI move from the current position. Returns null if the move is illegal. */
export function applyUci(g: GameState, uci: string): GameState | null {
  const chess = new Chess(currentFen(g));
  let m: Move;
  try {
    m = chess.move(parseUci(uci));
  } catch {
    return null;
  }
  return { ...g, moves: [...g.moves.slice(0, g.ply), record(chess, m)], ply: g.ply + 1 };
}

/** Play a SAN move from the current position. Returns null if the move is illegal. */
export function applySan(g: GameState, san: string): GameState | null {
  const chess = new Chess(currentFen(g));
  let m: Move;
  try {
    m = chess.move(san);
  } catch {
    return null;
  }
  return { ...g, moves: [...g.moves.slice(0, g.ply), record(chess, m)], ply: g.ply + 1 };
}

export function sanFromUci(fen: string, uci: string): string | null {
  const { from, to, promotion } = parseUci(uci);
  const m = legalMoves(fen).find(
    (x) => x.from === from && x.to === to && (x.promotion ?? undefined) === promotion,
  );
  return m ? m.san : null;
}

export function uciFromSan(fen: string, san: string): string | null {
  try {
    const m = new Chess(fen).move(san);
    return moveToUci(m);
  } catch {
    return null;
  }
}

/** EPD of the position reached by playing `uci` from `fen`, or null if illegal. */
export function epdAfter(fen: string, uci: string): string | null {
  const chess = new Chess(fen);
  try {
    chess.move(parseUci(uci));
  } catch {
    return null;
  }
  return toEpd(chess.fen());
}

/** Build a game from a sequence of UCI moves (e.g. an opening line from the book). */
export function gameFromUciLine(
  uciMoves: string[],
  startFen: string = START_FEN,
): GameState | null {
  let g = newGame(startFen);
  for (const uci of uciMoves) {
    const next = applyUci(g, uci);
    if (!next) return null;
    g = next;
  }
  return g;
}

export function statusOf(fen: string): GameStatus {
  const chess = new Chess(fen);
  const turn = turnOf(fen);
  const check = chess.inCheck();
  if (chess.isCheckmate()) {
    return {
      over: true,
      result: turn === 'white' ? '0-1' : '1-0',
      reason: 'checkmate',
      check,
      turn,
    };
  }
  if (chess.isStalemate())
    return { over: true, result: '1/2-1/2', reason: 'stalemate', check, turn };
  if (chess.isInsufficientMaterial()) {
    return { over: true, result: '1/2-1/2', reason: 'insufficient', check, turn };
  }
  if (chess.isThreefoldRepetition()) {
    return { over: true, result: '1/2-1/2', reason: 'threefold', check, turn };
  }
  if (chess.isDraw()) return { over: true, result: '1/2-1/2', reason: 'fiftyMoves', check, turn };
  return { over: false, check, turn };
}

/** PGN movetext for the moves up to the cursor, e.g. "1. e4 c5 2. Nf3". */
export function movetext(g: GameState, upToPly: number = g.ply): string {
  const parts: string[] = [];
  let moveNo = moveNumberOf(g.startFen);
  const blackStarts = turnOf(g.startFen) === 'black';
  g.moves.slice(0, upToPly).forEach((m, i) => {
    const whiteMove = blackStarts ? i % 2 === 1 : i % 2 === 0;
    if (whiteMove) parts.push(`${moveNo}.`);
    else if (i === 0) parts.push(`${moveNo}...`);
    parts.push(m.san);
    if (!whiteMove) moveNo += 1;
  });
  return parts.join(' ');
}

/** SAN movetext of a UCI line from the start position, for display in the library. */
export function movetextOfUciLine(uciMoves: string[]): string {
  const g = gameFromUciLine(uciMoves);
  return g ? movetext(g) : uciMoves.join(' ');
}
