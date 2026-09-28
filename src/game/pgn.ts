import { Chess } from 'chess.js';
import { moveToUci } from './game';

export interface ImportedGame {
  /** UCI moves from the standard start position. */
  moves: string[];
  headers: Record<string, string>;
}

/** Extracts a Lichess game id from a pasted URL (game page, embed, or bare id). */
export function lichessGameId(text: string): string | null {
  const trimmed = text.trim();
  const url = trimmed.match(
    /lichess\.org\/(?:embed\/)?(?:game\/)?([A-Za-z0-9]{8})(?:[A-Za-z0-9]{4})?(?:[/?#]|$)/,
  );
  if (url) return url[1];
  if (/^[A-Za-z0-9]{8}$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Parses PGN as exported by Lichess, chess.com and most GUIs (headers, comments, clock and
 * eval annotations, NAGs, results). Throws with a short message when it cannot be read.
 */
export function parsePgn(text: string): ImportedGame {
  // Drop a leading byte-order mark (some exports start with one), then normalise newlines.
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const cleaned = withoutBom.replace(/\r\n?/g, '\n').trim();
  if (!cleaned) throw new Error('empty');
  const chess = new Chess();
  chess.loadPgn(cleaned, { strict: false });
  const moves = chess.history({ verbose: true }).map(moveToUci);
  if (moves.length === 0) throw new Error('no moves');
  const api = chess as unknown as {
    getHeaders?: () => Record<string, string>;
    header?: () => Record<string, string>;
  };
  const headers = api.getHeaders?.() ?? api.header?.() ?? {};
  return { moves, headers };
}

export async function fetchLichessPgn(id: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(
    `https://lichess.org/game/export/${id}?clocks=false&evals=false&literate=false`,
    { headers: { Accept: 'application/x-chess-pgn' }, signal },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Human-friendly "White vs Black" line from PGN headers. */
export function describeHeaders(h: Record<string, string>): string {
  const w = h.White ?? '?';
  const b = h.Black ?? '?';
  const we = h.WhiteElo ? ` (${h.WhiteElo})` : '';
  const be = h.BlackElo ? ` (${h.BlackElo})` : '';
  const result = h.Result && h.Result !== '*' ? ` · ${h.Result}` : '';
  return `${w}${we} – ${b}${be}${result}`;
}
