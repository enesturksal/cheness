import type { StringKey } from '../i18n/strings';
import { useT } from '../i18n/useT';
import { goBack } from '../store/history';
import { useStore, type Mode } from '../store/useStore';
import { IconBack, IconMoon, IconSun, IconUser } from './Icons';

const MODE_KEY: Record<Mode, StringKey> = {
  bot: 'mode.bot',
  friends: 'mode.friends',
  explore: 'mode.explore',
  analysis: 'mode.analysis',
  study: 'mode.study',
};

export function TopBar() {
  const t = useT();
  const view = useStore((s) => s.view);
  const mode = useStore((s) => s.mode);
  const setView = useStore((s) => s.setView);
  const theme = useStore((s) => s.theme);
  const lichessUser = useStore((s) => s.lichessUser);
  const setSettings = useStore((s) => s.setSettings);

  const title =
    view === 'play'
      ? t(MODE_KEY[mode])
      : view === 'library'
        ? t('nav.library')
        : view === 'openings'
          ? t('nav.openings')
          : view === 'games'
            ? t('home.games')
            : view === 'profile'
              ? t('profile.title')
              : view === 'sources'
                ? t('sources.title')
                : view === 'studies'
                  ? t('home.studies')
                  : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
        {view !== 'home' && (
          <button
            type="button"
            className="btn-icon"
            aria-label={t('nav.back')}
            title={t('nav.back')}
            onClick={goBack}
          >
            <IconBack />
          </button>
        )}
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={() => setView('home')}
          aria-label={t('nav.home')}
          title={t('nav.home')}
        >
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="size-6 rounded" />
          <span className="text-base font-bold tracking-tight">{t('appName')}</span>
        </button>
        {title && (
          <span className="chip ml-1 max-w-[38vw] truncate whitespace-nowrap text-muted sm:max-w-none">
            {title}
          </span>
        )}
        <div className="grow" />
        <button
          type="button"
          className={`btn-icon ${view === 'profile' ? 'btn-primary' : ''}`}
          aria-label={t('profile.title')}
          title={lichessUser ?? t('profile.title')}
          onClick={() => setView('profile')}
        >
          <IconUser />
        </button>
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
