import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as G from '../game/game';
import type { AnalysisDepth, MoveAnnotation } from '../engine/analysis';
import { DEFAULT_LEVEL, type LevelId } from '../engine/difficulty';
import { detectLang, type Lang } from '../i18n/strings';
import {
  DEFAULT_RATINGS,
  DEFAULT_SPEEDS,
  type ExplorerDb,
  type ExplorerResponse,
  type RatingBucket,
  type Speed,
} from '../explorer/types';

export type Opponent = 'bot' | 'human';
export type Theme = 'dark' | 'light';
export type View = 'play' | 'library';
export type PanelTab = 'opening' | 'moves' | 'settings';
export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';
export type ExplorerStatus =
  | 'idle'
  | 'loading'
  | 'ok'
  | 'empty'
  | 'offline'
  | 'ratelimited'
  | 'unauthorized'
  | 'error'
  | 'skipped';

export interface ExplorerState {
  /** Cache key of the query these results belong to. */
  key: string | null;
  status: ExplorerStatus;
  data: ExplorerResponse | null;
}

export interface Settings {
  playerColor: G.Color;
  opponent: Opponent;
  level: LevelId;
  tutorEnabled: boolean;
  showOpponentHints: boolean;
  explorerDb: ExplorerDb;
  ratings: RatingBucket[];
  speeds: Speed[];
  theme: Theme;
  lang: Lang;
  autoQueen: boolean;
  /** Lichess OAuth / personal token; the opening explorer API requires one (since 2026). */
  lichessToken: string | null;
  lichessUser: string | null;
  /** Engine depth for move classification; 0 disables it. */
  analysisDepth: AnalysisDepth;
}

export interface NewGameOptions {
  playerColor?: G.Color | 'random';
  startFen?: string;
  opponent?: Opponent;
}

export interface StoreState extends Settings {
  game: G.GameState;
  /** Increments on every new game/line so stale async bot results can be discarded. */
  gameId: number;
  orientation: G.Color;
  takeover: boolean;
  botThinking: boolean;
  engineStatus: EngineStatus;
  /** UCI move previewed as an arrow on the board (first tap in the opening panel). */
  previewUci: string | null;
  view: View;
  panelTab: PanelTab;
  explorer: ExplorerState;
  /** Engine verdict per played move (index = ply - 1); null while pending. */
  annotations: (MoveAnnotation | null)[];

  playUci: (uci: string) => boolean;
  undo: () => void;
  redo: () => void;
  goToPly: (ply: number) => void;
  newGame: (opts?: NewGameOptions) => void;
  loadLine: (uciMoves: string[], opts?: { playerColor?: G.Color; opponent?: Opponent }) => boolean;
  flipBoard: () => void;
  setPreview: (uci: string | null) => void;
  setSettings: (s: Partial<Settings>) => void;
  setTakeover: (v: boolean) => void;
  setBotThinking: (v: boolean) => void;
  setEngineStatus: (v: EngineStatus) => void;
  setView: (v: View) => void;
  setPanelTab: (v: PanelTab) => void;
  setExplorer: (e: ExplorerState) => void;
  setAnnotation: (index: number, a: MoveAnnotation) => void;
}

const defaultSettings: Settings = {
  playerColor: 'white',
  opponent: 'bot',
  level: DEFAULT_LEVEL,
  tutorEnabled: true,
  showOpponentHints: false,
  explorerDb: 'lichess',
  ratings: DEFAULT_RATINGS,
  speeds: DEFAULT_SPEEDS,
  theme: 'dark',
  lang: detectLang(),
  autoQueen: false,
  lichessToken: null,
  lichessUser: null,
  analysisDepth: 10,
};

function pickColor(c: G.Color | 'random' | undefined, fallback: G.Color): G.Color {
  if (c === 'random') return Math.random() < 0.5 ? 'white' : 'black';
  return c ?? fallback;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      game: G.newGame(),
      gameId: 0,
      orientation: 'white',
      takeover: false,
      botThinking: false,
      engineStatus: 'idle',
      previewUci: null,
      view: 'play',
      panelTab: 'opening',
      explorer: { key: null, status: 'idle', data: null },
      annotations: [],

      playUci: (uci) => {
        const s = get();
        const next = G.applyUci(s.game, uci);
        if (!next) return false;
        // Branching discards annotations of the moves that were cut off.
        set({ game: next, previewUci: null, annotations: s.annotations.slice(0, s.game.ply) });
        return true;
      },

      undo: () =>
        set((s) => {
          if (s.game.ply === 0) return {};
          let ply = s.game.ply - 1;
          // Against the bot, take back to the player's own turn (usually two plies).
          const vsBot = s.opponent === 'bot' && !s.takeover;
          if (vsBot && ply > 0 && G.turnOf(G.fenAt(s.game, ply)) !== s.playerColor) ply -= 1;
          return { game: { ...s.game, ply }, previewUci: null, botThinking: false };
        }),

      redo: () =>
        set((s) =>
          s.game.ply < s.game.moves.length
            ? { game: { ...s.game, ply: s.game.ply + 1 }, previewUci: null }
            : {},
        ),

      goToPly: (ply) =>
        set((s) => ({
          game: { ...s.game, ply: Math.max(0, Math.min(ply, s.game.moves.length)) },
          previewUci: null,
        })),

      newGame: (opts) =>
        set((s) => {
          const color = pickColor(opts?.playerColor, s.playerColor);
          return {
            game: G.newGame(opts?.startFen),
            gameId: s.gameId + 1,
            playerColor: color,
            orientation: color,
            opponent: opts?.opponent ?? s.opponent,
            takeover: false,
            botThinking: false,
            previewUci: null,
            annotations: [],
            view: 'play',
          };
        }),

      loadLine: (uciMoves, opts) => {
        const game = G.gameFromUciLine(uciMoves);
        if (!game) return false;
        set((s) => {
          const color = opts?.playerColor ?? s.playerColor;
          return {
            game,
            gameId: s.gameId + 1,
            playerColor: color,
            orientation: color,
            opponent: opts?.opponent ?? s.opponent,
            takeover: false,
            botThinking: false,
            previewUci: null,
            annotations: [],
            view: 'play',
            panelTab: 'opening',
          };
        });
        return true;
      },

      flipBoard: () => set((s) => ({ orientation: G.opposite(s.orientation) })),
      setPreview: (uci) => set({ previewUci: uci }),
      setSettings: (partial) => set(partial),
      setTakeover: (v) => set({ takeover: v, botThinking: v ? false : get().botThinking }),
      setBotThinking: (v) => set({ botThinking: v }),
      setEngineStatus: (v) => set({ engineStatus: v }),
      setView: (v) => set({ view: v, previewUci: null }),
      setPanelTab: (v) => set({ panelTab: v }),
      setExplorer: (e) => set({ explorer: e }),
      setAnnotation: (index, a) =>
        set((s) => {
          if (index < 0 || index >= s.game.moves.length) return {};
          const annotations = s.annotations.slice(0, s.game.moves.length);
          while (annotations.length < index) annotations.push(null);
          annotations[index] = a;
          return { annotations };
        }),
    }),
    {
      name: 'bookline',
      version: 1,
      partialize: (s) => ({
        playerColor: s.playerColor,
        opponent: s.opponent,
        level: s.level,
        tutorEnabled: s.tutorEnabled,
        showOpponentHints: s.showOpponentHints,
        explorerDb: s.explorerDb,
        ratings: s.ratings,
        speeds: s.speeds,
        theme: s.theme,
        lang: s.lang,
        autoQueen: s.autoQueen,
        lichessToken: s.lichessToken,
        lichessUser: s.lichessUser,
        analysisDepth: s.analysisDepth,
        game: s.game,
        orientation: s.orientation,
      }),
    },
  ),
);

/** Selectors shared by several components. */
export const selectFen = (s: StoreState): string => G.currentFen(s.game);
export const selectTurn = (s: StoreState): G.Color => G.turnOf(G.currentFen(s.game));
export const selectAtTip = (s: StoreState): boolean => G.atTip(s.game);

/** True when the human is expected to move in the current position (not the bot). */
export function humanToMove(s: StoreState): boolean {
  if (s.opponent === 'human' || s.takeover) return true;
  return selectTurn(s) === s.playerColor;
}
