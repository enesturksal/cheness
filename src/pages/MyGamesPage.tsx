import { useState } from 'react';
import {
  fetchChesscomGames,
  fetchLichessGames,
  openingStats,
  type ImportedGameSummary,
  type Platform,
} from '../games/import';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';

function fmtDate(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString();
}

/** Pull a player's recent games from Lichess / chess.com, review them and see opening stats. */
export function MyGamesPage() {
  const t = useT();
  const lichessUsername = useStore((s) => s.lichessUsername);
  const chesscomUsername = useStore((s) => s.chesscomUsername);
  const token = useStore((s) => s.lichessToken);
  const setSettings = useStore((s) => s.setSettings);
  const loadGame = useStore((s) => s.loadGame);
  const analysisDepth = useStore((s) => s.analysisDepth);

  const [platform, setPlatform] = useState<Platform>(
    chesscomUsername && !lichessUsername ? 'chesscom' : 'lichess',
  );
  const [name, setName] = useState(platform === 'lichess' ? lichessUsername : chesscomUsername);
  const [games, setGames] = useState<ImportedGameSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchPlatform = (p: Platform) => {
    setPlatform(p);
    setName(p === 'lichess' ? lichessUsername : chesscomUsername);
    setGames(null);
    setError(null);
  };

  const fetchGames = async () => {
    const u = name.trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      const list =
        platform === 'lichess'
          ? await fetchLichessGames(u, 40, token)
          : await fetchChesscomGames(u, 40);
      setGames(list);
      setSettings(platform === 'lichess' ? { lichessUsername: u } : { chesscomUsername: u });
    } catch {
      setError(t('games.error'));
      setGames(null);
    } finally {
      setLoading(false);
    }
  };

  const review = (g: ImportedGameSummary) => {
    if (analysisDepth === 0) setSettings({ analysisDepth: 14 });
    loadGame(g.moves, {
      mode: 'analysis',
      playerColor: g.myColor,
      meta: { white: g.white, black: g.black, result: g.result, site: g.url },
    });
  };

  const stats = games ? openingStats(games) : [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-3 md:p-6">
      <h2 className="text-lg font-bold">{t('home.games')}</h2>
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="seg">
          <button
            type="button"
            aria-pressed={platform === 'lichess'}
            onClick={() => switchPlatform('lichess')}
          >
            Lichess
          </button>
          <button
            type="button"
            aria-pressed={platform === 'chesscom'}
            onClick={() => switchPlatform('chesscom')}
          >
            chess.com
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('games.username')}
          autoCapitalize="off"
          autoCorrect="off"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void fetchGames();
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || !name.trim()}
          onClick={() => void fetchGames()}
        >
          {loading ? t('games.fetching') : t('games.fetch')}
        </button>
        {error && <p className="w-full text-xs text-danger">{error}</p>}
      </div>

      {games && games.length === 0 && <p className="text-sm text-muted">{t('games.none')}</p>}

      {stats.length > 0 && (
        <section className="card p-3">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {t('games.openings')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 text-left">ECO</th>
                  <th className="py-1 text-left">{t('home.openings')}</th>
                  <th className="py-1 text-right">#</th>
                  <th className="py-1 text-right">{t('games.score')}</th>
                  <th className="py-1 text-right">{t('games.asWhite')}</th>
                  <th className="py-1 text-right">{t('games.asBlack')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.name} className="border-t border-line">
                    <td className="py-1">
                      <span className="eco">{s.eco ?? '—'}</span>
                    </td>
                    <td className="py-1 font-medium">{s.name}</td>
                    <td className="py-1 text-right tabular-nums">{s.games}</td>
                    <td className="py-1 text-right tabular-nums">
                      {s.wins} / {s.draws} / {s.losses}
                    </td>
                    <td className="py-1 text-right tabular-nums">{s.asWhite}</td>
                    <td className="py-1 text-right tabular-nums">{s.asBlack}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {games && games.length > 0 && (
        <section className="card p-1">
          <h3 className="px-2 pt-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {t('games.recent')}
          </h3>
          {games.map((g) => {
            const won =
              (g.result === '1-0' && g.myColor === 'white') ||
              (g.result === '0-1' && g.myColor === 'black');
            const lost =
              (g.result === '0-1' && g.myColor === 'white') ||
              (g.result === '1-0' && g.myColor === 'black');
            return (
              <div
                key={g.id}
                className="flex items-center gap-2 border-t border-line px-2 py-2 text-sm"
              >
                <span
                  className={`w-8 shrink-0 text-center text-xs font-bold ${won ? 'text-accent' : lost ? 'text-danger' : 'text-muted'}`}
                >
                  {won ? 'W' : lost ? 'L' : 'D'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <span className={g.myColor === 'white' ? 'font-semibold' : ''}>{g.white}</span>
                    {g.whiteRating ? ` (${g.whiteRating})` : ''} –{' '}
                    <span className={g.myColor === 'black' ? 'font-semibold' : ''}>{g.black}</span>
                    {g.blackRating ? ` (${g.blackRating})` : ''}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {fmtDate(g.playedAt)} · {g.speed} · {g.opening?.eco ? `${g.opening.eco} ` : ''}
                    {g.opening?.name ?? ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn px-2.5 py-1.5 text-xs"
                  disabled={g.moves.length === 0}
                  onClick={() => review(g)}
                >
                  {t('games.review')}
                </button>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
