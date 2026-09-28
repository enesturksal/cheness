/**
 * Fetch a player's recent games from Lichess or chess.com (public APIs, CORS enabled) so they
 * can be reviewed in the app and summarised per opening.
 */
import { Chess } from 'chess.js';
import { moveToUci, type Color } from '../game/game';
import { parsePgn } from '../game/pgn';

export type Platform = 'lichess' | 'chesscom';

export interface ImportedGameSummary {
  id: string;
  platform: Platform;
  url: string;
  /** Epoch milliseconds. */
  playedAt: number;
  white: string;
  black: string;
  whiteRating?: number;
  blackRating?: number;
  /** '1-0' | '0-1' | '1/2-1/2' | '*' */
  result: string;
  speed: string;
  /** Which side the requested player had. */
  myColor: Color;
  /** ECO/name as reported by the platform, if any. */
  opening?: { eco?: string; name?: string };
  moves: string[];
}

function sanLineToUci(line: string): string[] {
  const chess = new Chess();
  const out: string[] = [];
  for (const san of line.trim().split(/\s+/)) {
    if (!san) continue;
    try {
      out.push(moveToUci(chess.move(san)));
    } catch {
      break;
    }
  }
  return out;
}

interface LichessGame {
  id: string;
  speed?: string;
  createdAt?: number;
  status?: string;
  winner?: 'white' | 'black';
  players: {
    white: { user?: { name: string }; rating?: number; aiLevel?: number };
    black: { user?: { name: string }; rating?: number; aiLevel?: number };
  };
  opening?: { eco: string; name: string; ply: number };
  moves?: string;
}

/**
 * Recent games of a Lichess user (NDJSON stream). The token is sent when available; Lichess
 * may require it for this endpoint.
 */
export async function fetchLichessGames(
  username: string,
  max = 30,
  token?: string | null,
  signal?: AbortSignal,
): Promise<ImportedGameSummary[]> {
  const p = new URLSearchParams({
    max: String(max),
    opening: 'true',
    moves: 'true',
    pgnInJson: 'false',
  });
  const headers: Record<string, string> = { Accept: 'application/x-ndjson' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(
    `https://lichess.org/api/games/user/${encodeURIComponent(username)}?${p.toString()}`,
    { headers, signal },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const me = username.toLowerCase();
  const out: ImportedGameSummary[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let g: LichessGame;
    try {
      g = JSON.parse(line) as LichessGame;
    } catch {
      continue;
    }
    const white =
      g.players.white.user?.name ??
      (g.players.white.aiLevel ? `Stockfish ${g.players.white.aiLevel}` : '?');
    const black =
      g.players.black.user?.name ??
      (g.players.black.aiLevel ? `Stockfish ${g.players.black.aiLevel}` : '?');
    const result =
      g.winner === 'white'
        ? '1-0'
        : g.winner === 'black'
          ? '0-1'
          : g.status === 'draw' || g.status === 'stalemate'
            ? '1/2-1/2'
            : g.status && g.status !== 'started'
              ? '1/2-1/2'
              : '*';
    out.push({
      id: g.id,
      platform: 'lichess',
      url: `https://lichess.org/${g.id}`,
      playedAt: g.createdAt ?? 0,
      white,
      black,
      whiteRating: g.players.white.rating,
      blackRating: g.players.black.rating,
      result,
      speed: g.speed ?? '',
      myColor: white.toLowerCase() === me ? 'white' : 'black',
      opening: g.opening ? { eco: g.opening.eco, name: g.opening.name } : undefined,
      moves: sanLineToUci(g.moves ?? ''),
    });
  }
  return out;
}

interface ChesscomGame {
  url: string;
  pgn?: string;
  end_time?: number;
  time_class?: string;
  eco?: string;
  white: { username: string; rating?: number; result: string };
  black: { username: string; rating?: number; result: string };
}

function chesscomResult(g: ChesscomGame): string {
  if (g.white.result === 'win') return '1-0';
  if (g.black.result === 'win') return '0-1';
  return '1/2-1/2';
}

/** Recent games of a chess.com user: the newest monthly archive(s). */
export async function fetchChesscomGames(
  username: string,
  max = 30,
  signal?: AbortSignal,
): Promise<ImportedGameSummary[]> {
  const base = `https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}`;
  const arch = await fetch(`${base}/games/archives`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!arch.ok) throw new Error(`HTTP ${arch.status}`);
  const { archives } = (await arch.json()) as { archives: string[] };
  const out: ImportedGameSummary[] = [];
  const me = username.toLowerCase();
  for (const url of [...archives].reverse().slice(0, 3)) {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) continue;
    const { games } = (await res.json()) as { games: ChesscomGame[] };
    for (const g of [...games].reverse()) {
      if (!g.pgn) continue;
      let parsed: ReturnType<typeof parsePgn>;
      try {
        parsed = parsePgn(g.pgn);
      } catch {
        continue;
      }
      const { moves, headers } = parsed;
      const ecoUrl = g.eco ?? headers.ECOUrl;
      const name = ecoUrl
        ? decodeURIComponent(ecoUrl.split('/').pop() ?? '').replace(/-/g, ' ')
        : undefined;
      out.push({
        id: g.url.split('/').pop() ?? g.url,
        platform: 'chesscom',
        url: g.url,
        playedAt: (g.end_time ?? 0) * 1000,
        white: g.white.username,
        black: g.black.username,
        whiteRating: g.white.rating,
        blackRating: g.black.rating,
        result: chesscomResult(g),
        speed: g.time_class ?? '',
        myColor: g.white.username.toLowerCase() === me ? 'white' : 'black',
        opening: { eco: headers.ECO, name },
        moves,
      });
      if (out.length >= max) return out;
    }
  }
  return out;
}

export interface OpeningStat {
  name: string;
  eco?: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  asWhite: number;
  asBlack: number;
}

/** Group games by opening family (name before the colon) with the player's score. */
export function openingStats(games: readonly ImportedGameSummary[]): OpeningStat[] {
  const map = new Map<string, OpeningStat>();
  for (const g of games) {
    const full = g.opening?.name ?? '?';
    const name = full.split(':')[0].trim() || '?';
    const s = map.get(name) ?? {
      name,
      eco: g.opening?.eco,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      asWhite: 0,
      asBlack: 0,
    };
    s.games += 1;
    if (g.myColor === 'white') s.asWhite += 1;
    else s.asBlack += 1;
    const won =
      (g.result === '1-0' && g.myColor === 'white') ||
      (g.result === '0-1' && g.myColor === 'black');
    const lost =
      (g.result === '0-1' && g.myColor === 'white') ||
      (g.result === '1-0' && g.myColor === 'black');
    if (won) s.wins += 1;
    else if (lost) s.losses += 1;
    else if (g.result === '1/2-1/2') s.draws += 1;
    map.set(name, s);
  }
  return [...map.values()].sort((a, b) => b.games - a.games);
}
