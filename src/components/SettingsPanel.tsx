import { ANALYSIS_DEPTHS } from '../engine/analysis';
import { LEVELS, type LevelId } from '../engine/difficulty';
import { bookMeta } from '../explorer/book';
import { ALL_SPEEDS, RATING_BUCKETS, type RatingBucket, type Speed } from '../explorer/types';
import { LANGS, type Lang, type StringKey } from '../i18n/strings';
import { useT } from '../i18n/useT';
import { useStore, type Mode } from '../store/useStore';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 select-none">
      <input
        type="checkbox"
        className="mt-0.5 size-4 accent-[var(--accent)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm">
        {label}
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function ratingLabel(r: RatingBucket): string {
  const i = RATING_BUCKETS.indexOf(r);
  const next = RATING_BUCKETS[i + 1];
  if (r === 0) return `<${next}`;
  return next ? `${r}–${next - 1}` : `${r}+`;
}

const SPEED_LABEL: Record<Speed, string> = {
  ultraBullet: 'UltraBullet',
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
  correspondence: 'Corr.',
};

const MODES: { mode: Mode; key: StringKey }[] = [
  { mode: 'bot', key: 'mode.bot' },
  { mode: 'explore', key: 'mode.explore' },
  { mode: 'friends', key: 'mode.friends' },
  { mode: 'analysis', key: 'mode.analysis' },
];

export function SettingsPanel() {
  const t = useT();
  const s = useStore();
  const set = s.setSettings;

  const toggleIn = <T,>(list: T[], v: T): T[] => {
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    return next.length ? next : list; // keep at least one
  };

  return (
    <div className="flex flex-col gap-5 p-3">
      <Section title={t('opponent.label')}>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              className={`chip ${s.mode === m.mode ? 'chip-on' : ''}`}
              onClick={() => s.setMode(m.mode)}
            >
              {t(m.key)}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('side.label')}>
        <div className="seg">
          <button
            type="button"
            aria-pressed={s.playerColor === 'white'}
            onClick={() => useStore.setState({ playerColor: 'white', orientation: 'white' })}
          >
            {t('side.white')}
          </button>
          <button
            type="button"
            aria-pressed={s.playerColor === 'black'}
            onClick={() => useStore.setState({ playerColor: 'black', orientation: 'black' })}
          >
            {t('side.black')}
          </button>
        </div>
      </Section>

      <Section title={t('level.label')}>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`chip ${s.level === l.id ? 'chip-on' : ''}`}
              onClick={() => set({ level: l.id as LevelId })}
            >
              {t(l.key)} <span className="ml-1 opacity-70">{l.elo}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{t('level.hint')}</p>
      </Section>

      <Section title={t('tutor.label')}>
        <Toggle
          label={t('tutor.label')}
          checked={s.tutorEnabled}
          onChange={(v) => set({ tutorEnabled: v })}
        />
        <Toggle
          label={t('controls.arrows')}
          checked={s.showArrows}
          onChange={(v) => set({ showArrows: v })}
        />
        <Toggle
          label={t('tutor.opponentHints')}
          checked={s.showOpponentHints}
          onChange={(v) => set({ showOpponentHints: v })}
        />
        <Toggle
          label={t('takeover.label')}
          hint={t('takeover.hint')}
          checked={s.takeover}
          onChange={(v) => s.setTakeover(v)}
        />
        <Toggle
          label={t('settings.autoFlip')}
          checked={s.autoFlip}
          onChange={(v) => set({ autoFlip: v })}
        />
        <Toggle
          label={t('settings.autoQueen')}
          checked={s.autoQueen}
          onChange={(v) => set({ autoQueen: v })}
        />
      </Section>

      <Section title={t('analysis.label')}>
        <div className="flex flex-wrap gap-1.5">
          {ANALYSIS_DEPTHS.map((d) => (
            <button
              key={d.depth}
              type="button"
              className={`chip ${s.analysisDepth === d.depth ? 'chip-on' : ''}`}
              onClick={() => set({ analysisDepth: d.depth })}
            >
              {t(d.key as StringKey)}
            </button>
          ))}
        </div>
        <Toggle
          label={t('settings.cloudEval')}
          checked={s.useCloudEval}
          onChange={(v) => set({ useCloudEval: v })}
        />
        <p className="text-xs text-muted">{t('analysis.hint')}</p>
      </Section>

      <Section title={t('lichess.section')}>
        <p className="text-sm">
          {s.lichessUser ? (
            <>
              {t('lichess.loggedInAs')} <strong>{s.lichessUser}</strong>
            </>
          ) : (
            t('settings.profileLink')
          )}
        </p>
        <div>
          <button type="button" className="btn" onClick={() => s.setView('profile')}>
            {t('profile.title')}
          </button>
        </div>
      </Section>

      <Section title={t('explorer.ratings')}>
        <div className="flex flex-wrap gap-1.5">
          {RATING_BUCKETS.map((r) => (
            <button
              key={r}
              type="button"
              className={`chip ${s.ratings.includes(r) ? 'chip-on' : ''}`}
              onClick={() => set({ ratings: toggleIn(s.ratings, r) })}
            >
              {ratingLabel(r)}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('explorer.speeds')}>
        <div className="flex flex-wrap gap-1.5">
          {ALL_SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              className={`chip ${s.speeds.includes(sp) ? 'chip-on' : ''}`}
              onClick={() => set({ speeds: toggleIn(s.speeds, sp) })}
            >
              {SPEED_LABEL[sp]}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('settings.theme')}>
        <div className="seg">
          <button
            type="button"
            aria-pressed={s.theme === 'dark'}
            onClick={() => set({ theme: 'dark' })}
          >
            {t('settings.dark')}
          </button>
          <button
            type="button"
            aria-pressed={s.theme === 'light'}
            onClick={() => set({ theme: 'light' })}
          >
            {t('settings.light')}
          </button>
        </div>
      </Section>

      <Section title={t('settings.language')}>
        <div className="seg">
          {LANGS.map((l: Lang) => (
            <button
              key={l}
              type="button"
              aria-pressed={s.lang === l}
              onClick={() => set({ lang: l })}
            >
              {l === 'tr' ? 'Türkçe' : 'English'}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('settings.about')}>
        <p className="text-xs leading-relaxed text-muted">
          BookLine · Stockfish 19 (lite, single-thread WASM, GPL-3.0) · chessground (GPL-3.0) ·
          chess.js (BSD-2) · Opening names: lichess-org/chess-openings (CC0, {bookMeta().count}{' '}
          {t('library.openings')}, {bookMeta().generatedAt}) · Statistics: Lichess Opening Explorer
          · Deep evaluations: Lichess cloud eval, ChessDB · Theory: Wikibooks (CC BY-SA).
        </p>
      </Section>
    </div>
  );
}
