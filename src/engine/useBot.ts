import { useEffect } from 'react';
import { atTip, currentFen, statusOf, turnOf } from '../game/game';
import { useStore } from '../store/useStore';
import { levelById } from './difficulty';
import { getEngine } from './engineManager';

const MIN_THINK_MS = 350;

/**
 * Drives the bot: whenever it is the engine's turn at the tip of the game (and takeover is
 * off), request a move at the current difficulty and play it if the position is unchanged.
 * The difficulty is read when the search starts, so changes apply to the next move.
 */
export function useBot(): void {
  const game = useStore((s) => s.game);
  const gameId = useStore((s) => s.gameId);
  const mode = useStore((s) => s.mode);
  const takeover = useStore((s) => s.takeover);
  const playerColor = useStore((s) => s.playerColor);

  const fen = currentFen(game);
  const tip = atTip(game);

  useEffect(() => {
    const store = useStore.getState();
    const botTurn =
      mode === 'bot' && !takeover && tip && turnOf(fen) !== playerColor && !statusOf(fen).over;
    if (!botTurn) {
      if (store.botThinking) store.setBotThinking(false);
      return;
    }

    let cancelled = false;
    const engine = getEngine();
    const level = levelById(store.level);
    store.setBotThinking(true);
    if (store.engineStatus === 'idle') store.setEngineStatus('loading');
    engine.ready.then(
      () => {
        if (!cancelled) useStore.getState().setEngineStatus('ready');
      },
      () => {
        if (!cancelled) useStore.getState().setEngineStatus('error');
      },
    );

    const started = Date.now();
    engine
      .bestMove(fen, { skill: level.skill, depth: level.depth, movetime: level.movetime })
      .then(async (res) => {
        const wait = MIN_THINK_MS - (Date.now() - started);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        if (cancelled) return;
        const s = useStore.getState();
        const samePosition =
          s.gameId === gameId && currentFen(s.game) === fen && atTip(s.game) && !s.takeover;
        if (samePosition && res.bestmove) s.playUci(res.bestmove);
        s.setBotThinking(false);
      })
      .catch(() => {
        if (cancelled) return;
        const s = useStore.getState();
        s.setEngineStatus('error');
        s.setBotThinking(false);
      });

    return () => {
      cancelled = true;
      engine.stop();
    };
  }, [fen, tip, gameId, mode, takeover, playerColor]);
}
