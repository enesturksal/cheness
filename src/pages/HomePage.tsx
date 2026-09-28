import { useMemo, useState } from 'react';
import {
  IconBook,
  IconChart,
  IconHistory,
  IconLibrary,
  IconPlay,
  IconUserBig,
  IconUsers,
} from '../components/Icons';
import { LEVELS, type LevelId } from '../engine/difficulty';
import { openingForLine } from '../explorer/book';
import { movetext, type Color } from '../game/game';
import { fetchLichessPgn, lichessGameId, parsePgn } from '../game/pgn';
import type { StringKey } from '../i18n/strings';
import { useT } from '../i18n/useT';
import { useStore, type Mode } from '../store/useStore';

const MODE_KEY: Record<Mode, StringKey> = {
  bot: 'mode.bot',
  friends: 'mode.friends',
  explore: 'mode.explore',
  analysis: 'mode.analysis',
};

function Card({
  icon,
  title,
  desc,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`card flex flex-col gap-3 p-4 text-left ${onClick ? 'hover:bg-bg3' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg3 text-accent">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold">{title}</h2>
          <p className="text-xs text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </Tag>
  );
}

export function HomePage() {
  const t = useT();
  const game = useStore((s) => s.game);
  const mode = useStore((s) => s.mode);
  const playerColor = useStore((s) => s.playerColor);
  const level = useStore((s) => s.level);
  const tutorEnabled = useStore((s) => s.tutorEnabled);
  const analysisDepth = useStore((s) => s.analysisDepth);
  const lichessUser = useStore((s) => s.lichessUser);
  const newGame = useStore((s) => s.newGame);
  const loadGame = useStore((s) => s.loadGame);
  const setSettings = useStore((s) => s.setSettings);
  const setView = useStore((s) => s.setView);

  const [side, setSide] = useState<Color | 'random'>(playerColor);
  const [pgn, setPgn] = useState('');
  const [pgnError, setPgnError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const current = useMemo(() => openingForLine(game.moves, game.ply, game.startFen), [game]);

  const analyse = async () => {
    setPgnError(null);
    let text = pgn;
    const id = lichessGameId(text);
    if (id) {
      setImporting(true);
      try {
        text = await fetchLichessPgn(id);
      } catch {
        setPgnError(t('home.analyzeFetchError'));
        setImporting(false);
        return;
      }
    }
    try {
      const g = parsePgn(text);
      if (analysisDepth === 0) setSettings({ analysisDepth: 14 });
      loadGame(g.moves, {
        mode: 'analysis',
        meta: {
          white: g.headers.White,
          black: g.headers.Black,
          result: g.headers.Result,
          event: g.headers.Event,
          site: g.headers.Site,
        },
      });
      setPgn('');
    } catch {
      setPgnError(t('home.analyzeError'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-3 md:p-6">
      {game.moves.length > 0 && (
        <button
          type="button"
          onClick={() => setView('play')}
          className="card flex items-center gap-3 p-3 text-left hover:bg-bg3"
        >
          <span className="chip chip-on shrink-0">{t(MODE_KEY[mode])}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t('home.continue')}</span>
            <span className="block truncate text-xs text-muted">
              {current.opening?.name ?? movetext(game)} · {movetext(game).slice(0, 60)}
            </span>
          </span>
        </button>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Card icon={<IconPlay />} title={t('home.play')} desc={t('home.playDesc')}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="seg">
              {(['white', 'black', 'random'] as const).map((c) => (
                <button key={c} type="button" aria-pressed={side === c} onClick={() => setSide(c)}>
                  {t(`side.${c}` as StringKey)}
                </button>
              ))}
            </div>
            <select
              className="rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm text-fg"
              value={level}
              onChange={(e) => setSettings({ level: Number(e.target.value) as LevelId })}
              aria-label={t('level.label')}
            >
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {t(l.key)} ({l.elo})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => newGame({ mode: 'bot', playerColor: side })}
            >
              {t('home.start')}
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                className="size-4 accent-[var(--accent)]"
                checked={tutorEnabled}
                onChange={(e) => setSettings({ tutorEnabled: e.target.checked })}
              />
              {t('home.tutorOn')}
            </label>
          </div>
        </Card>

        <Card icon={<IconChart />} title={t('home.analyze')} desc={t('home.analyzeDesc')}>
          <textarea
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            placeholder={t('home.analyzePlaceholder')}
            rows={3}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-line bg-bg2 px-2 py-1.5 font-mono text-xs"
          />
          {pgnError && <p className="text-xs text-danger">{pgnError}</p>}
          <div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!pgn.trim() || importing}
              onClick={() => void analyse()}
            >
              {importing ? '…' : t('home.analyzeButton')}
            </button>
          </div>
        </Card>

        <Card icon={<IconUsers />} title={t('home.friends')} desc={t('home.friendsDesc')}>
          <p className="text-xs text-muted">{t('home.friendsNote')}</p>
          <div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => newGame({ mode: 'friends', playerColor: 'white' })}
            >
              {t('home.start')}
            </button>
          </div>
        </Card>

        <Card
          icon={<IconBook />}
          title={t('home.openings')}
          desc={t('home.openingsDesc')}
          onClick={() => setView('openings')}
        />
        <Card
          icon={<IconLibrary />}
          title={t('home.library')}
          desc={t('home.libraryDesc')}
          onClick={() => setView('library')}
        />
        <Card
          icon={<IconHistory />}
          title={t('home.games')}
          desc={t('home.gamesDesc')}
          onClick={() => setView('games')}
        />
        <Card
          icon={<IconUserBig />}
          title={t('profile.title')}
          desc={lichessUser ? `Lichess: ${lichessUser}` : t('profile.desc')}
          onClick={() => setView('profile')}
        />
      </div>
    </div>
  );
}
