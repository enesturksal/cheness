import { useMemo } from 'react';
import type { DrawShape } from '@lichess-org/chessground/draw';
import { Board } from '../components/Board';
import { Controls } from '../components/Controls';
import { MoveList } from '../components/MoveList';
import { OpeningPanel } from '../components/OpeningPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { StatusBar } from '../components/StatusBar';
import { currentFen, destsFor, lastMoveSquares, parseUci, statusOf, turnOf } from '../game/game';
import { useT } from '../i18n/useT';
import { useStore, type PanelTab } from '../store/useStore';

const TABS: PanelTab[] = ['opening', 'moves', 'settings'];

export function PlayPage() {
  const t = useT();
  const game = useStore((s) => s.game);
  const orientation = useStore((s) => s.orientation);
  const previewUci = useStore((s) => s.previewUci);
  const autoQueen = useStore((s) => s.autoQueen);
  const opponent = useStore((s) => s.opponent);
  const takeover = useStore((s) => s.takeover);
  const playerColor = useStore((s) => s.playerColor);
  const panelTab = useStore((s) => s.panelTab);
  const setPanelTab = useStore((s) => s.setPanelTab);
  const playUci = useStore((s) => s.playUci);

  const fen = currentFen(game);
  const turn = turnOf(fen);
  const status = useMemo(() => statusOf(fen), [fen]);
  const dests = useMemo(() => destsFor(fen), [fen]);
  const lastMove = useMemo(() => lastMoveSquares(game), [game]);
  const movableColor = status.over
    ? undefined
    : opponent === 'human' || takeover
      ? 'both'
      : playerColor;
  const autoShapes = useMemo<DrawShape[]>(() => {
    if (!previewUci) return [];
    const { from, to } = parseUci(previewUci);
    return [{ orig: from, dest: to, brush: 'green' }];
  }, [previewUci]);

  const tabLabel: Record<PanelTab, string> = {
    opening: t('tabs.opening'),
    moves: t('tabs.moves'),
    settings: t('tabs.settings'),
  };

  return (
    // The board column never scrolls away on phones: the panel below it scrolls on its own
    // (the page only scrolls when the screen is too short for both).
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-2 p-2 md:flex-row md:items-stretch md:gap-4 md:p-4">
      <div className="w-full shrink-0 md:w-[min(56vw,calc(100dvh-9rem))]">
        <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-24rem))] md:max-w-none">
          <Board
            fen={fen}
            orientation={orientation}
            turnColor={turn}
            lastMove={lastMove}
            check={status.check}
            dests={dests}
            movableColor={movableColor}
            onMove={playUci}
            autoShapes={autoShapes}
            autoQueen={autoQueen}
          />
        </div>
        <StatusBar />
        <Controls />
      </div>

      <div className="card flex min-h-[200px] min-w-0 flex-1 flex-col md:min-h-0 safe-bottom">
        <div className="flex border-b border-line">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 px-3 py-2.5 text-sm font-medium ${
                panelTab === tab ? 'border-b-2 border-accent text-fg' : 'text-muted'
              }`}
              onClick={() => setPanelTab(tab)}
            >
              {tabLabel[tab]}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {panelTab === 'opening' && <OpeningPanel />}
          {panelTab === 'moves' && <MoveList />}
          {panelTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}
