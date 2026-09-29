/**
 * Lichess studies as lessons. Public studies export as one PGN per chapter through the API
 * (no login, CORS enabled). Comments become position-bound lesson text, and the authors'
 * `[%cal]` arrows / `[%csl]` squares become board shapes.
 */
import { Chess } from 'chess.js';
import type { DrawShape } from '@lichess-org/chessground/draw';
import type { Key } from '@lichess-org/chessground/types';
import { kvGet, kvSet } from '../explorer/cache';
import { moveToUci } from '../game/game';

export interface StudyChapter {
  name: string;
  url: string;
  /** Lichess chapter mode, e.g. "gamebook" for interactive lessons. */
  mode: string | null;
  /** Custom start position, when the chapter does not begin from the initial position. */
  startFen: string | null;
  /** Main line in UCI. */
  moves: string[];
  /** Lesson text per position, keyed by `posKey(fen)`. */
  comments: Record<string, string>;
  /** Author's arrows and highlighted squares per position. */
  shapes: Record<string, DrawShape[]>;
  eco: string | null;
  opening: string | null;
}

export interface Study {
  id: string;
  name: string;
  author: string | null;
  url: string;
  chapters: StudyChapter[];
  fetchedAt: number;
}

export interface StudyRef {
  id: string;
  name: string;
  author: string | null;
}

const API = 'https://lichess.org/api/study';

/** Study id from a pasted URL (`lichess.org/study/<id>` or `<id>/<chapter>`) or a bare id. */
export function studyIdFrom(text: string): string | null {
  const s = text.trim();
  const m = s.match(/lichess\.org\/study\/([A-Za-z0-9]{8})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9]{8}$/.test(s)) return s;
  return null;
}

/**
 * Key for comments/shapes: board, side to move and castling rights only. chess.js prints the
 * en-passant square only when a capture is possible, and move counters differ when the same
 * position is reached from a custom start, so the full FEN is too strict.
 */
export function posKey(fen: string): string {
  return fen.split(' ').slice(0, 3).join(' ');
}

const BRUSH: Record<string, string> = { G: 'green', R: 'red', B: 'blue', Y: 'yellow' };

/** Split lichess-style `[%cal ...]` / `[%csl ...]` tags out of a comment. */
export function splitCommentTags(raw: string): { text: string; shapes: DrawShape[] } {
  const shapes: DrawShape[] = [];
  const text = raw
    .replace(/\[%cal\s+([^\]]+)\]/g, (_m, list: string) => {
      for (const tok of list.split(',')) {
        const t = tok.trim();
        const mm = t.match(/^([GRBY])([a-h][1-8])([a-h][1-8])$/);
        if (mm) shapes.push({ orig: mm[2] as Key, dest: mm[3] as Key, brush: BRUSH[mm[1]] });
      }
      return '';
    })
    .replace(/\[%csl\s+([^\]]+)\]/g, (_m, list: string) => {
      for (const tok of list.split(',')) {
        const t = tok.trim();
        const mm = t.match(/^([GRBY])([a-h][1-8])$/);
        if (mm) shapes.push({ orig: mm[2] as Key, brush: BRUSH[mm[1]] });
      }
      return '';
    })
    .replace(/\[%[a-z]+\s+[^\]]*\]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text, shapes };
}

/** Parse one exported chapter. Returns null when the movetext cannot be read. */
export function parseChapter(pgn: string): StudyChapter | null {
  // chess.js cannot read two consecutive comment blocks ("{ text } { [%cal ...] }"): merge them.
  const merged = pgn.replace(/\}\s*\{/g, ' ');
  const chess = new Chess();
  try {
    chess.loadPgn(merged, { strict: false });
  } catch {
    return null;
  }
  const h = chess.getHeaders();
  const comments: Record<string, string> = {};
  const shapes: Record<string, DrawShape[]> = {};
  for (const c of chess.getComments()) {
    const { text, shapes: sh } = splitCommentTags(c.comment);
    const key = posKey(c.fen);
    if (text) comments[key] = text;
    if (sh.length) shapes[key] = sh;
  }
  return {
    name: h.ChapterName ?? h.Event ?? '?',
    url: h.ChapterURL ?? '',
    mode: h.ChapterMode ?? null,
    startFen: h.FEN ?? null,
    moves: chess.history({ verbose: true }).map(moveToUci),
    comments,
    shapes,
    eco: h.ECO ?? null,
    opening: h.Opening ?? null,
  };
}

export function parseStudyPgn(id: string, text: string): Study {
  const parts = text
    .replace(/\r\n?/g, '\n')
    .split(/\n\n+(?=\[Event )/)
    .filter((p) => p.trim());
  const chapters = parts.map(parseChapter).filter((c): c is StudyChapter => c !== null);
  const first = parts[0] ?? '';
  const name = first.match(/\[StudyName "([^"]*)"\]/)?.[1] ?? chapters[0]?.name ?? id;
  const annot = first.match(/\[Annotator "([^"]*)"\]/)?.[1] ?? null;
  const author = annot ? (annot.match(/@\/([^/\s]+)/)?.[1] ?? annot) : null;
  return {
    id,
    name,
    author,
    url: `https://lichess.org/study/${id}`,
    chapters,
    fetchedAt: Date.now(),
  };
}

export async function fetchStudy(id: string, signal?: AbortSignal): Promise<Study> {
  const cached = await kvGet<Study>(`study|${id}`);
  if (cached && cached.chapters.length) return cached;
  const res = await fetch(`${API}/${id}.pgn?comments=true&variations=true&clocks=false`, {
    headers: { Accept: 'application/x-chess-pgn' },
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const study = parseStudyPgn(id, await res.text());
  if (study.chapters.length === 0) throw new Error('no chapters');
  void kvSet(`study|${id}`, study);
  return study;
}
