import { EXPLORER_HOST } from '../explorer/api';
import type { ExplorerDb, ExplorerGame } from '../explorer/types';
import { currentEpd, gameFromUciLine } from '../game/game';
import { fetchLichessPgn, parsePgn } from '../game/pgn';
import { useStore } from '../store/useStore';

/**
 * Load a reference game from the explorer into the app (analysis mode) and put the cursor on
 * the first ply that reaches the position the user was looking at.
 */
export async function openReferenceGame(
  game: ExplorerGame,
  db: ExplorerDb,
  token: string | null,
): Promise<void> {
  let pgn: string;
  if (db === 'masters') {
    const res = await fetch(`${EXPLORER_HOST}/masters/pgn/${game.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pgn = await res.text();
  } else {
    pgn = await fetchLichessPgn(game.id);
  }
  const parsed = parsePgn(pgn);
  const s = useStore.getState();
  const target = currentEpd(s.game);
  const full = gameFromUciLine(parsed.moves);
  let ply = parsed.moves.length;
  if (full) {
    const idx = full.moves.findIndex((m) => m.epd === target);
    if (idx >= 0) ply = idx + 1;
  }
  const h = parsed.headers;
  const white = h.White ?? game.white.name;
  const black = h.Black ?? game.black.name;
  s.loadGame(parsed.moves, {
    mode: 'analysis',
    ply,
    meta: {
      white: h.WhiteElo ? `${white} (${h.WhiteElo})` : white,
      black: h.BlackElo ? `${black} (${h.BlackElo})` : black,
      result:
        h.Result ?? (game.winner === 'white' ? '1-0' : game.winner === 'black' ? '0-1' : '1/2-1/2'),
      event: h.Event ?? (db === 'masters' ? 'Masters' : 'Lichess'),
      site: db === 'masters' ? h.Site : `https://lichess.org/${game.id}`,
    },
  });
}

export function resultOf(game: ExplorerGame): string {
  return game.winner === 'white' ? '1-0' : game.winner === 'black' ? '0-1' : '½-½';
}
