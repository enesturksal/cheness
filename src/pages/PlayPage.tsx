import { useMemo } from 'react';
import type { DrawShape } from '@lichess-org/chessground/draw';
import { Board } from '../components/Board';
import { Controls } from '../components/Controls';
import { LiteraturePanel } from '../components/LiteraturePanel';
import { MaterialRow } from '../components/MaterialRow';
import { MoveList } from '../components/MoveList';
import { OpeningPanel } from '../components/OpeningPanel';
import { ReportPanel } from '../components/ReportPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { StatusBar } from '../components/StatusBar';
import { formatScore, negateScore } from '../engine/analysis';
import { movePercent } from '../explorer/api';
import { explorerQueryFor } from '../explorer/query';
import {
  currentFen,
  destsFor,
  lastMoveSquares,
  opposite,
  parseUci,
  statusOf,
  turnOf,
  type Color,
} from '../game/game';
import { useT } from '../i18n/useT';
import { useStore, type PanelTab } from '../store/useStore';

const TABS: PanelTab[] = ['opening', 'literature', 'moves', 'report', 'settings'];

/** Brush names defined in Board.tsx: popular moves fade with rank, engine lines are blue. */
const POP_BRUSH = ['pop1', 'pop2', 'pop3'];
const ENG_BRUSH = ['eng1', 'eng2', 'eng3'];

export function PlayPage() {
  const t = useT();
  const game = useStore((s) => s.game);
  const mode = useStore((s) => s.mode);
  const meta = useStore((s) => s.meta);
  const storedOrientation = useStore((s) => s.orientation);
  const autoFlip = useStore((s) => s.autoFlip);
  const previewUci = useStore((s) => s.previewUci);
  const autoQueen = useStore((s) => s.autoQueen);
  const takeover = useStore((s) => s.takeover);
  const playerColor = useStore((s) => s.playerColor);
  const panelTab = useStore((s) => s.panelTab);
  const setPanelTab = useStore((s) => s.setPanelTab);
  const playUci = useStore((s) => s.playUci);
  const showArrows = useStore((s) => s.showArrows);
  const explorer = useStore((s) => s.explorer);
  const explorerKey = useStore((s) => explorerQueryFor(s).key);
  const suggestions = useStore((s) => s.suggestions);

  const fen = currentFen(game);
  const turn = turnOf(fen);
  const status = useMemo(() => statusOf(fen), [fen]);
  const dests = useMemo(() => destsFor(fen), [fen]);
  const lastMove = useMemo(() => lastMoveSquares(game), [game]);
  const orientation = mode === 'friends' && autoFlip ? turn : storedOrientation;
  const movableColor = status.over ? undefined : mode !== 'bot' || takeover ? 'both' : playerColor;
  const playedUci = game.ply < game.moves.length ? game.moves[game.ply].uci : null;

  const autoShapes = useMemo<DrawShape[]>(() => {
    const shapes: DrawShape[] = [];
    if (showArrows && !status.over) {
      const data = explorer.key === explorerKey ? explorer.data : null;
      if (data && data.moves.length) {
        data.moves.slice(0, 3).forEach((m, i) => {
          const { from, to } = parseUci(m.uci);
          shapes.push({
            orig: from,
            dest: to,
            brush: POP_BRUSH[i],
            label: { text: `${Math.round(movePercent(m, data))}%` },
          });
        });
      } else if (suggestions.fen === fen && suggestions.status === 'ok') {
        suggestions.lines.forEach((l, i) => {
          const { from, to } = parseUci(l.uci);
          const white = turn === 'white' ? l.score : negateScore(l.score);
          shapes.push({
            orig: from,
            dest: to,
            brush: ENG_BRUSH[i],
            label: { text: formatScore(white) },
          });
        });
      }
      // The move actually played from here (when stepping through a game).
      if (playedUci) {
        const { from, to } = parseUci(playedUci);
        shapes.push({ orig: from, dest: to, brush: 'played' });
      }
    }
    if (previewUci) {
      const { from, to } = parseUci(previewUci);
      shapes.push({ orig: from, dest: to, brush: 'yellow' });
    }
    return shapes;
  }, [
    showArrows,
    status.over,
    explorer,
    explorerKey,
    suggestions,
    fen,
    turn,
    previewUci,
    playedUci,
  ]);

  const labelFor = (c: Color): string => {
    if (mode === 'bot') return c === playerColor ? t('status.you') : 'Stockfish';
    if (mode === 'analysis' && meta) {
      const n = c === 'white' ? meta.white : meta.black;
      if (n) return n;
    }
    return c === 'white' ? t('side.white') : t('side.black');
  };
  const top = opposite(orientation);
  const bottom = orientation;

  const tabLabel: Record<PanelTab, string> = {
    opening: t('tabs.opening'),
    literature: t('tabs.literature'),
    moves: t('tabs.moves'),
    report: t('tabs.report'),
    settings: t('tabs.settings'),
  };

  return (
    // The board column never scrolls away on phones: the panel below it scrolls on its own
    // (the page only scrolls when the screen is too short for both).
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-2 p-2 md:flex-row md:items-stretch md:gap-4 md:p-4">
      <div className="w-full shrink-0 md:w-[min(56vw,calc(100dvh-9rem))]">
        <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-26rem))] md:max-w-none">
          <MaterialRow color={top} label={labelFor(top)} />
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
          <MaterialRow color={bottom} label={labelFor(bottom)} />
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
              className={`flex-1 px-2 py-2.5 text-sm font-medium ${
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
          {panelTab === 'literature' && <LiteraturePanel />}
          {panelTab === 'moves' && <MoveList />}
          {panelTab === 'report' && <ReportPanel />}
          {panelTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}
