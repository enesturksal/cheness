import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as G from '../game/game';
import type { AnalysisDepth, MoveAnnotation, Score } from '../engine/analysis';
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

/**
 * How the board is being used:
 * - bot: you against Stockfish
 * - friends: two people on one device (pass and play)
 * - explore: both sides by hand with the tutor (opening study)
 * - analysis: reviewing an imported game
 */
export type Mode = 'bot' | 'friends' | 'explore' | 'analysis';
export type Theme = 'dark' | 'light';
export type View = 'home' | 'play' | 'library' | 'openings';
export type PanelTab = 'opening' | 'moves' | 'report' | 'settings';
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

export interface Suggestion {
  uci: string;
  san: string;
  /** Side-to-move perspective. */
  score: Score;
}

export interface SuggestionState {
  fen: string | null;
  status: 'idle' | 'loading' | 'ok' | 'none';
  source: 'cloud' | 'engine' | null;
  depth: number;
  lines: Suggestion[];
}

export interface GameMeta {
  white?: string;
  black?: string;
  result?: string;
  event?: string;
  site?: string;
}

export interface Settings {
  playerColor: G.Color;
  level: LevelId;
  tutorEnabled: boolean;
  showOpponentHints: boolean;
  /** Draw the top continuations (or engine suggestions) as arrows on the board. */
  showArrows: boolean;
  /** Pass-and-play: turn the board towards the side to move. */
  autoFlip: boolean;
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
  /** Prefer Lichess cloud evaluations (deep Stockfish) when available. */
  useCloudEval: boolean;
}

export interface NewGameOptions {
  mode?: Mode;
  playerColor?: G.Color | 'random';
  startFen?: string;
}

export interface LoadGameOptions {
  mode: Mode;
  playerColor?: G.Color;
  meta?: GameMeta;
  /** Where to place the cursor; defaults to the end of the line. */
  ply?: number;
}

export interface StoreState extends Settings {
  game: G.GameState;
  /** Increments on every new game/line so stale async bot results can be discarded. */
  gameId: number;
  mode: Mode;
  meta: GameMeta | null;
  orientation: G.Color;
  takeover: boolean;
  botThinking: boolean;
  engineStatus: EngineStatus;
  /** UCI move previewed as an arrow on the board (first tap in the opening panel). */
  previewUci: string | null;
  view: View;
  panelTab: PanelTab;
  explorer: ExplorerState;
  suggestions: SuggestionState;
  /** Engine verdict per played move (index = ply - 1); null while pending. */
  annotations: (MoveAnnotation | null)[];
  /** Family to open when the library is shown next (set by the Openings screen). */
  libraryFamily: string | null;

  playUci: (uci: string) => boolean;
  undo: () => void;
  redo: () => void;
  goToPly: (ply: number) => void;
  newGame: (opts?: NewGameOptions) => void;
  loadGame: (uciMoves: string[], opts: LoadGameOptions) => boolean;
  flipBoard: () => void;
  setPreview: (uci: string | null) => void;
  setSettings: (s: Partial<Settings>) => void;
  setMode: (m: Mode) => void;
  setTakeover: (v: boolean) => void;
  setBotThinking: (v: boolean) => void;
  setEngineStatus: (v: EngineStatus) => void;
  setView: (v: View) => void;
  openLibraryFamily: (family: string | null) => void;
  setPanelTab: (v: PanelTab) => void;
  setExplorer: (e: ExplorerState) => void;
  setSuggestions: (s: SuggestionState) => void;
  setAnnotation: (index: number, a: MoveAnnotation) => void;
}

const defaultSettings: Settings = {
  playerColor: 'white',
  level: DEFAULT_LEVEL,
  tutorEnabled: true,
  showOpponentHints: false,
  showArrows: true,
  autoFlip: true,
  explorerDb: 'lichess',
  ratings: DEFAULT_RATINGS,
  speeds: DEFAULT_SPEEDS,
  theme: 'dark',
  lang: detectLang(),
  autoQueen: false,
  lichessToken: null,
  lichessUser: null,
  analysisDepth: 10,
  useCloudEval: true,
};

const idleSuggestions: SuggestionState = {
  fen: null,
  status: 'idle',
  source: null,
  depth: 0,
  lines: [],
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
      mode: 'bot',
      meta: null,
      orientation: 'white',
      takeover: false,
      botThinking: false,
      engineStatus: 'idle',
      previewUci: null,
      view: 'home',
      panelTab: 'opening',
      explorer: { key: null, status: 'idle', data: null },
      suggestions: idleSuggestions,
      annotations: [],
      libraryFamily: null,

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
          const vsBot = s.mode === 'bot' && !s.takeover;
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
          const mode = opts?.mode ?? s.mode;
          const color = pickColor(opts?.playerColor, s.playerColor);
          return {
            game: G.newGame(opts?.startFen),
            gameId: s.gameId + 1,
            mode,
            meta: null,
            playerColor: color,
            orientation: mode === 'bot' ? color : 'white',
            takeover: false,
            botThinking: false,
            previewUci: null,
            annotations: [],
            view: 'play',
            panelTab: 'opening',
          };
        }),

      loadGame: (uciMoves, opts) => {
        const game = G.gameFromUciLine(uciMoves);
        if (!game) return false;
        set((s) => {
          const color = opts.playerColor ?? (opts.mode === 'bot' ? s.playerColor : 'white');
          return {
            game: { ...game, ply: opts.ply ?? game.moves.length },
            gameId: s.gameId + 1,
            mode: opts.mode,
            meta: opts.meta ?? null,
            playerColor: color,
            orientation: color,
            takeover: false,
            botThinking: false,
            previewUci: null,
            annotations: [],
            view: 'play',
            panelTab: opts.mode === 'analysis' ? 'report' : 'opening',
          };
        });
        return true;
      },

      flipBoard: () => set((s) => ({ orientation: G.opposite(s.orientation) })),
      setPreview: (uci) => set({ previewUci: uci }),
      setSettings: (partial) => set(partial),
      setMode: (mode) => set({ mode, takeover: false, botThinking: false }),
      setTakeover: (v) => set({ takeover: v, botThinking: v ? false : get().botThinking }),
      setBotThinking: (v) => set({ botThinking: v }),
      setEngineStatus: (v) => set({ engineStatus: v }),
      setView: (v) => set({ view: v, previewUci: null }),
      openLibraryFamily: (family) =>
        set({ view: 'library', libraryFamily: family, previewUci: null }),
      setPanelTab: (v) => set({ panelTab: v }),
      setExplorer: (e) => set({ explorer: e }),
      setSuggestions: (sg) => set({ suggestions: sg }),
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
      version: 2,
      partialize: (s) => ({
        playerColor: s.playerColor,
        level: s.level,
        tutorEnabled: s.tutorEnabled,
        showOpponentHints: s.showOpponentHints,
        showArrows: s.showArrows,
        autoFlip: s.autoFlip,
        explorerDb: s.explorerDb,
        ratings: s.ratings,
        speeds: s.speeds,
        theme: s.theme,
        lang: s.lang,
        autoQueen: s.autoQueen,
        lichessToken: s.lichessToken,
        lichessUser: s.lichessUser,
        analysisDepth: s.analysisDepth,
        useCloudEval: s.useCloudEval,
        game: s.game,
        mode: s.mode,
        meta: s.meta,
        orientation: s.orientation,
      }),
    },
  ),
);

/** Selectors shared by several components. */
export const selectFen = (s: StoreState): string => G.currentFen(s.game);
export const selectTurn = (s: StoreState): G.Color => G.turnOf(G.currentFen(s.game));
export const selectAtTip = (s: StoreState): boolean => G.atTip(s.game);

/** True when a person (not the bot) is expected to move in the current position. */
export function humanToMove(s: StoreState): boolean {
  if (s.mode !== 'bot' || s.takeover) return true;
  return selectTurn(s) === s.playerColor;
}
