import { LEVELS, type LevelId } from '../engine/difficulty';
import type { StringKey } from '../i18n/strings';
import { useT } from '../i18n/useT';
import { useStore, type ArrowMode } from '../store/useStore';
import {
  IconBar,
  IconEye,
  IconFirst,
  IconFlip,
  IconLast,
  IconNext,
  IconPlus,
  IconPrev,
} from './Icons';

const ARROW_CYCLE: ArrowMode[] = ['popular', 'engine', 'both', 'off'];
const ARROW_LABEL: Record<ArrowMode, StringKey> = {
  popular: 'arrows.mode.popular',
  engine: 'arrows.mode.engine',
  both: 'arrows.mode.both',
  off: 'arrows.mode.off',
};

export function Controls() {
  const t = useT();
  const game = useStore((s) => s.game);
  const mode = useStore((s) => s.mode);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const goToPly = useStore((s) => s.goToPly);
  const flipBoard = useStore((s) => s.flipBoard);
  const setView = useStore((s) => s.setView);
  const takeover = useStore((s) => s.takeover);
  const setTakeover = useStore((s) => s.setTakeover);
  const level = useStore((s) => s.level);
  const arrowMode = useStore((s) => s.arrowMode);
  const showEvalBar = useStore((s) => s.showEvalBar);
  const autoFlip = useStore((s) => s.autoFlip);
  const setSettings = useStore((s) => s.setSettings);

  const nextArrowMode = ARROW_CYCLE[(ARROW_CYCLE.indexOf(arrowMode) + 1) % ARROW_CYCLE.length];

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
          disabled={mode === 'friends' && autoFlip}
        >
          <IconFlip />
        </button>
        <button
          type="button"
          className={`btn-icon gap-1 ${arrowMode !== 'off' ? 'btn-primary' : ''}`}
          aria-pressed={arrowMode !== 'off'}
          aria-label={t('controls.arrows')}
          title={`${t('controls.arrows')}: ${t(ARROW_LABEL[arrowMode])} → ${t(ARROW_LABEL[nextArrowMode])}`}
          onClick={() => setSettings({ arrowMode: nextArrowMode })}
        >
          <IconEye off={arrowMode === 'off'} />
          <span className="text-[11px] font-semibold">{t(ARROW_LABEL[arrowMode])}</span>
        </button>
        <button
          type="button"
          className={`btn-icon ${showEvalBar ? 'btn-primary' : ''}`}
          aria-pressed={showEvalBar}
          aria-label={t('evalbar.toggle')}
          title={t('evalbar.toggle')}
          onClick={() => setSettings({ showEvalBar: !showEvalBar })}
        >
          <IconBar />
        </button>
        <div className="grow" />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setView('home')}
          aria-label={t('controls.newGame')}
          title={t('controls.newGame')}
        >
          <IconPlus />
          <span className="hidden sm:inline">{t('controls.newGame')}</span>
        </button>
      </div>
      {arrowMode !== 'off' && <p className="text-[11px] text-muted">{t('arrows.legend')}</p>}
      {mode === 'bot' && (
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
          <label className="flex items-center gap-1.5 text-xs text-muted" title={t('level.hint')}>
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
      {mode === 'friends' && (
        <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            className="size-4 accent-[var(--accent)]"
            checked={autoFlip}
            onChange={(e) => setSettings({ autoFlip: e.target.checked })}
          />
          <span>{t('settings.autoFlip')}</span>
        </label>
      )}
    </div>
  );
}
