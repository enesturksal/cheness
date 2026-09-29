import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';

export const AUTHOR = 'Mustafa Enes Türksal';
export const CONTACT = 'cheness.app@gmail.com';
export const REPO_URL = 'https://github.com/enesturksal/cheness';

/** Credits, contact, licence and data-source links; shown at the bottom of the main screens. */
export function AppFooter() {
  const t = useT();
  const setView = useStore((s) => s.setView);
  return (
    <footer className="mt-6 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
      <p>
        Cheness © {new Date().getFullYear()} · {t('footer.by')}{' '}
        <strong className="text-fg">{AUTHOR}</strong> ·{' '}
        <a className="underline" href={`mailto:${CONTACT}`}>
          {CONTACT}
        </a>
      </p>
      <p>
        {t('footer.rights')}{' '}
        <a className="underline" href={REPO_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>{' '}
        ·{' '}
        <a
          className="underline"
          href="https://www.gnu.org/licenses/gpl-3.0.html"
          target="_blank"
          rel="noreferrer"
        >
          GPL-3.0-or-later
        </a>{' '}
        ·{' '}
        <button type="button" className="underline" onClick={() => setView('sources')}>
          {t('sources.title')}
        </button>
      </p>
      <p>{t('footer.independent')}</p>
    </footer>
  );
}
