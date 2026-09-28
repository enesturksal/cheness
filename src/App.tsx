import { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { useBot } from './engine/useBot';
import { startExplorerController } from './explorer/controller';
import { completeLoginFromUrl, fetchUsername } from './explorer/lichessAuth';
import { LibraryPage } from './pages/LibraryPage';
import { PlayPage } from './pages/PlayPage';
import { useStore } from './store/useStore';

export default function App() {
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.theme);
  const lang = useStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.lang = lang;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#161512' : '#f3efe6');
  }, [theme, lang]);

  useEffect(() => startExplorerController(), []);

  // Finish a "Login with Lichess" round-trip, and backfill the username for pasted tokens.
  useEffect(() => {
    const { setSettings, lichessToken, lichessUser } = useStore.getState();
    completeLoginFromUrl()
      .then((session) => {
        if (session) setSettings({ lichessToken: session.token, lichessUser: session.username });
        else if (lichessToken && !lichessUser) {
          return fetchUsername(lichessToken).then((u) => u && setSettings({ lichessUser: u }));
        }
      })
      .catch((err: unknown) => console.error('Lichess login failed', err));
  }, []);
  useBot();

  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <main className="min-h-0 flex-1 overflow-y-auto">
        {view === 'play' ? <PlayPage /> : <LibraryPage />}
      </main>
    </div>
  );
}
