import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { IconMoon, IconSun } from './Icons';

export function TopBar() {
  const t = useT();
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const theme = useStore((s) => s.theme);
  const setSettings = useStore((s) => s.setSettings);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="size-6 rounded" />
          <span className="text-base font-bold tracking-tight">{t('appName')}</span>
        </div>
        <nav className="seg ml-2">
          <button type="button" aria-pressed={view === 'play'} onClick={() => setView('play')}>
            {t('nav.play')}
          </button>
          <button
            type="button"
            aria-pressed={view === 'library'}
            onClick={() => setView('library')}
          >
            {t('nav.library')}
          </button>
        </nav>
        <div className="grow" />
        <button
          type="button"
          className="btn-icon"
          aria-label={t('settings.theme')}
          onClick={() => setSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </header>
  );
}
