import { LichessAccount } from '../components/LichessAccount';
import { LANGS, type Lang } from '../i18n/strings';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-2 p-3">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Personalisation: Lichess sign-in, usernames for game imports, language and theme.
 * Everything entered here stays in this device's browser storage; the app has no server.
 */
export function ProfilePage() {
  const t = useT();
  const lichessUsername = useStore((s) => s.lichessUsername);
  const chesscomUsername = useStore((s) => s.chesscomUsername);
  const theme = useStore((s) => s.theme);
  const lang = useStore((s) => s.lang);
  const set = useStore((s) => s.setSettings);
  const setView = useStore((s) => s.setView);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-3 md:p-6">
      <h2 className="text-lg font-bold">{t('profile.title')}</h2>
      <p className="text-sm text-muted">{t('profile.intro')}</p>

      <Section title={t('lichess.section')}>
        <LichessAccount />
      </Section>

      <Section title={t('profile.usernames')}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">Lichess</span>
          <input
            value={lichessUsername}
            onChange={(e) => set({ lichessUsername: e.target.value.trim() })}
            placeholder={t('games.username')}
            autoCapitalize="off"
            autoCorrect="off"
            className="rounded-lg border border-line bg-bg2 px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">chess.com</span>
          <input
            value={chesscomUsername}
            onChange={(e) => set({ chesscomUsername: e.target.value.trim() })}
            placeholder={t('games.username')}
            autoCapitalize="off"
            autoCorrect="off"
            className="rounded-lg border border-line bg-bg2 px-2 py-1.5"
          />
        </label>
        <p className="text-xs text-muted">{t('profile.usernamesHint')}</p>
        <div>
          <button type="button" className="btn" onClick={() => setView('games')}>
            {t('home.games')}
          </button>
        </div>
      </Section>

      <Section title={t('settings.language')}>
        <div className="seg">
          {LANGS.map((l: Lang) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => set({ lang: l })}
            >
              {l === 'tr' ? 'Türkçe' : 'English'}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('settings.theme')}>
        <div className="seg">
          <button
            type="button"
            aria-pressed={theme === 'dark'}
            onClick={() => set({ theme: 'dark' })}
          >
            {t('settings.dark')}
          </button>
          <button
            type="button"
            aria-pressed={theme === 'light'}
            onClick={() => set({ theme: 'light' })}
          >
            {t('settings.light')}
          </button>
        </div>
      </Section>

      <p className="text-xs text-muted">{t('profile.share')}</p>
    </div>
  );
}
