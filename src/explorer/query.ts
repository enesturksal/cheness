import { currentEpd, currentFen, turnOf } from '../game/game';
import type { StoreState } from '../store/useStore';
import { queryKey } from './api';
import type { ExplorerQuery } from './types';

export interface ResolvedQuery {
  q: ExplorerQuery;
  key: string;
  /** False when the panel should not fetch (tutor off, or bot's turn with hints hidden). */
  wanted: boolean;
}

/** The explorer query implied by the current store state. */
export function explorerQueryFor(s: StoreState): ResolvedQuery {
  const q: ExplorerQuery = {
    db: s.explorerDb,
    epd: currentEpd(s.game),
    ratings: s.ratings,
    speeds: s.speeds,
  };
  const turn = turnOf(currentFen(s.game));
  const humanTurn = s.opponent === 'human' || s.takeover || turn === s.playerColor;
  const wanted = s.tutorEnabled && (humanTurn || s.showOpponentHints);
  return { q, key: queryKey(q), wanted };
}
