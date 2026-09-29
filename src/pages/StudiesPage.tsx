import { useState } from 'react';
import { AppFooter } from '../components/AppFooter';
import { CURATED_STUDIES, type CuratedStudy } from '../data/studies';
import type { StringKey } from '../i18n/strings';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { fetchStudy, studyIdFrom, type StudyRef } from '../studies/lichessStudy';

const TOPICS: CuratedStudy['topic'][] = ['general', 'e4', 'd4', 'black', 'traps'];

/** Browse and open public Lichess studies as step-by-step lessons. */
export function StudiesPage() {
  const t = useT();
  const openStudy = useStore((s) => s.openStudy);
  const recent = useStore((s) => s.recentStudies);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      const study = await fetchStudy(id);
      if (!openStudy(study, 0)) throw new Error('unusable');
    } catch {
      setError(t('studies.error'));
    } finally {
      setBusy(null);
    }
  };

  const openInput = () => {
    const id = studyIdFrom(input);
    if (!id) {
      setError(t('studies.error'));
      return;
    }
    void open(id);
  };

  const Row = ({ s }: { s: StudyRef }) => (
    <div className="flex items-center gap-2 border-t border-line px-2 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{s.name}</div>
        {s.author && <div className="text-xs text-muted">@{s.author}</div>}
      </div>
      <button
        type="button"
        className="btn px-2.5 py-1.5 text-xs"
        disabled={busy !== null}
        onClick={() => void open(s.id)}
      >
        {busy === s.id ? t('studies.opening') : t('studies.open')}
      </button>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-3 md:p-6">
      <h2 className="text-lg font-bold">{t('home.studies')}</h2>
      <p className="text-sm text-muted">{t('studies.desc')}</p>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('studies.placeholder')}
          autoCapitalize="off"
          autoCorrect="off"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') openInput();
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy !== null || !input.trim()}
          onClick={openInput}
        >
          {t('studies.open')}
        </button>
        {error && <p className="w-full text-xs text-danger">{error}</p>}
      </div>

      {recent.length > 0 && (
        <section className="card p-1">
          <h3 className="px-2 pt-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {t('studies.recent')}
          </h3>
          {recent.map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </section>
      )}

      {TOPICS.map((topic) => (
        <section key={topic} className="card p-1">
          <h3 className="px-2 pt-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {t(`studies.topic.${topic}` as StringKey)}
          </h3>
          {CURATED_STUDIES.filter((s) => s.topic === topic).map((s) => (
            <Row key={s.id} s={s} />
          ))}
        </section>
      ))}

      <p className="text-xs text-muted">{t('studies.credit')}</p>
      <AppFooter />
    </div>
  );
}
