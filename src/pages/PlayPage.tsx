import { useMemo } from 'react';
import type { DrawShape } from '@lichess-org/chessground/draw';
import { Board } from '../components/Board';
import { Controls } from '../components/Controls';
import { EvalBar } from '../components/EvalBar';
import { LessonPanel } from '../components/LessonPanel';
import { posKey } from '../studies/lichessStudy';
import { LiteraturePanel } from '../components/LiteraturePanel';
import { MaterialRow } from '../components/MaterialRow';
import { MoveList } from '../components/MoveList';
import { OpeningPanel } from '../components/OpeningPanel';
import { ReportPanel } from '../components/ReportPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { StatusBar } from '../components/StatusBar';
import { formatScore, negateScore, type Score } from '../engine/analysis';
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
  const arrowMode = useStore((s) => s.arrowMode);
  const showEvalBar = useStore((s) => s.showEvalBar);
  const analysisDepth = useStore((s) => s.analysisDepth);
  const annotations = useStore((s) => s.annotations);
  const explorer = useStore((s) => s.explorer);
  const explorerKey = useStore((s) => explorerQueryFor(s).key);
  const suggestions = useStore((s) => s.suggestions);
  const study = useStore((s) => s.study);
  const studyChapter = useStore((s) => s.studyChapter);

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
    if (arrowMode !== 'off' && !status.over) {
      const live = explorer.key === explorerKey;
      const dbMoves = live && explorer.data?.moves.length ? explorer.data.moves : null;
      const dbLoading = !live || explorer.status === 'loading';
      const wantPopular = arrowMode === 'popular' || arrowMode === 'both';
      // "popular" falls back to engine lines only once the database has definitely no games.
      const wantEngine =
        arrowMode === 'engine' ||
        arrowMode === 'both' ||
        (arrowMode === 'popular' && !dbMoves && !dbLoading);
      const n = arrowMode === 'both' ? 2 : 3;
      const drawn = new Set<string>();
      if (wantPopular && dbMoves && explorer.data) {
        dbMoves.slice(0, n).forEach((m, i) => {
          const { from, to } = parseUci(m.uci);
          drawn.add(m.uci);
          shapes.push({
            orig: from,
            dest: to,
            brush: POP_BRUSH[i],
            label: { text: `${Math.round(movePercent(m, explorer.data!))}%` },
          });
        });
      }
      if (wantEngine && suggestions.fen === fen && suggestions.status === 'ok') {
        suggestions.lines
          .filter((l) => !drawn.has(l.uci))
          .slice(0, n)
          .forEach((l, i) => {
            const { from, to } = parseUci(l.uci);
            shapes.push({
              orig: from,
              dest: to,
              brush: ENG_BRUSH[i],
              label: { text: formatScore(l.score) },
            });
          });
      }
      // The move actually played from here (when stepping through a game).
      if (playedUci) {
        const { from, to } = parseUci(playedUci);
        shapes.push({ orig: from, dest: to, brush: 'played' });
      }
    }
    // The study author's own arrows and highlighted squares for this position.
    if (mode === 'study' && study) {
      const own = study.chapters[studyChapter]?.shapes[posKey(fen)];
      if (own) shapes.push(...own);
    }
    if (previewUci) {
      const { from, to } = parseUci(previewUci);
      shapes.push({ orig: from, dest: to, brush: 'yellow' });
    }
    return shapes;
  }, [
    arrowMode,
    status.over,
    explorer,
    explorerKey,
    suggestions,
    fen,
    previewUci,
    playedUci,
    mode,
    study,
    studyChapter,
  ]);

  // Evaluation of the viewed position from White's side, taken from the move verdicts:
  // the previous move's "after" score, else the next move's "before" score (when reviewing),
  // else the nearest earlier evaluated position (shown dimmed while the engine catches up).
  const evalAfterPly = (ply: number): Score | null => {
    if (ply <= 0) return null;
    const m = game.moves[ply - 1];
    const a = annotations[ply - 1];
    if (!a || a.uci !== m.uci) return null;
    return m.color === 'white' ? a.after : negateScore(a.after);
  };
  let barScore: Score | null = evalAfterPly(game.ply);
  if (!barScore && game.ply < game.moves.length) {
    const m = game.moves[game.ply];
    const a = annotations[game.ply];
    if (a && a.uci === m.uci) barScore = m.color === 'white' ? a.before : negateScore(a.before);
  }
  if (!barScore && game.ply === 0) barScore = { cp: 0, mate: null };
  if (status.over) {
    barScore =
      status.result === '1-0'
        ? { cp: null, mate: 1 }
        : status.result === '0-1'
          ? { cp: null, mate: -1 }
          : { cp: 0, mate: null };
  }
  const barPending = !barScore;
  let shownScore = barScore;
  for (let p = game.ply - 1; p >= 0 && !shownScore; p--) shownScore = evalAfterPly(p);

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

  const tabs: PanelTab[] = mode === 'study' ? ['lesson', ...TABS] : TABS;
  const tabLabel: Record<PanelTab, string> = {
    lesson: t('tabs.lesson'),
    opening: t('tabs.opening'),
    literature: t('tabs.literature'),
    moves: t('tabs.moves'),
    report: t('tabs.report'),
    settings: t('tabs.settings'),
  };

  return (
    // On desktop the board is capped (55vw, viewport height, 50rem) so the panel always keeps
    // a usable width whatever the monitor size or browser zoom.
    <div className="mx-auto flex h-full w-full max-w-[88rem] flex-col gap-2 p-2 md:flex-row md:items-stretch md:gap-4 md:p-4">
      <div className="w-full shrink-0 md:w-[min(55vw,calc(100dvh-11rem),50rem)]">
        <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-26rem))] md:max-w-none">
          <MaterialRow color={top} label={labelFor(top)} />
          <div className="flex items-stretch gap-1.5">
            {showEvalBar && analysisDepth > 0 && (
              <EvalBar score={shownScore} orientation={orientation} pending={barPending} />
            )}
            <div className="min-w-0 flex-1">
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
          </div>
          <MaterialRow color={bottom} label={labelFor(bottom)} />
        </div>
        <StatusBar />
        <Controls />
      </div>

      <div className="card flex min-h-[200px] min-w-0 flex-1 flex-col md:min-h-0 md:min-w-[22rem] safe-bottom">
        <div className="flex border-b border-line">
          {tabs.map((tab) => (
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
          {panelTab === 'lesson' && (mode === 'study' ? <LessonPanel /> : <OpeningPanel />)}
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
