import { LEVELS, type LevelId } from '../engine/difficulty';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { IconFirst, IconFlip, IconLast, IconNext, IconPlus, IconPrev } from './Icons';

export function Controls() {
  const t = useT();
  const game = useStore((s) => s.game);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const goToPly = useStore((s) => s.goToPly);
  const flipBoard = useStore((s) => s.flipBoard);
  const newGame = useStore((s) => s.newGame);
  const takeover = useStore((s) => s.takeover);
  const setTakeover = useStore((s) => s.setTakeover);
  const opponent = useStore((s) => s.opponent);
  const level = useStore((s) => s.level);
  const setSettings = useStore((s) => s.setSettings);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn-icon"
          onClick={() => goToPly(0)}
          disabled={game.ply === 0}
          aria-label={t('controls.start')}
        >
          <IconFirst />
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={undo}
          disabled={game.ply === 0}
          aria-label={t('controls.undo')}
        >
          <IconPrev />
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={redo}
          disabled={game.ply >= game.moves.length}
          aria-label={t('controls.redo')}
        >
          <IconNext />
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={() => goToPly(game.moves.length)}
          disabled={game.ply >= game.moves.length}
          aria-label={t('controls.end')}
        >
          <IconLast />
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={flipBoard}
          aria-label={t('controls.flip')}
        >
          <IconFlip />
        </button>
        <div className="grow" />
        <button type="button" className="btn btn-primary" onClick={() => newGame()}>
          <IconPlus />
          <span>{t('controls.newGame')}</span>
        </button>
      </div>
      {opponent === 'bot' && (
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
            <input
              type="checkbox"
              className="size-4 accent-[var(--accent)]"
              checked={takeover}
              onChange={(e) => setTakeover(e.target.checked)}
            />
            <span>{t('takeover.label')}</span>
          </label>
          <div className="grow" />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <span>{t('level.label')}</span>
            <select
              className="rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm text-fg"
              value={level}
              onChange={(e) => setSettings({ level: Number(e.target.value) as LevelId })}
            >
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {t(l.key)} ({l.elo})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
