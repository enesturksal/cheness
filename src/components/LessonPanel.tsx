import { currentFen, sanFromUci } from '../game/game';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { posKey } from '../studies/lichessStudy';
import { IconNext, IconPrev } from './Icons';

/** Turn plain text with URLs and newlines into paragraphs with links. */
function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n+/).map((p, i) => (
        <p key={i} className="leading-relaxed">
          {p.split(/(https?:\/\/\S+)/g).map((part, j) =>
            /^https?:\/\//.test(part) ? (
              <a
                key={j}
                className="text-accent underline"
                href={part}
                target="_blank"
                rel="noreferrer"
              >
                {part}
              </a>
            ) : (
              part
            ),
          )}
        </p>
      ))}
    </>
  );
}

/** Lesson text and navigation for the Lichess study being followed. */
export function LessonPanel() {
  const t = useT();
  const study = useStore((s) => s.study);
  const chapterIdx = useStore((s) => s.studyChapter);
  const game = useStore((s) => s.game);
  const openStudy = useStore((s) => s.openStudy);
  const playUci = useStore((s) => s.playUci);
  const redo = useStore((s) => s.redo);
  const goToPly = useStore((s) => s.goToPly);

  if (!study) return <p className="p-3 text-sm text-muted">{t('lesson.none')}</p>;
  const chapter = study.chapters[chapterIdx];
  if (!chapter) return null;

  const fen = currentFen(game);
  const text = chapter.comments[posKey(fen)] ?? null;
  const played = game.moves.slice(0, game.ply).map((m) => m.uci);
  const matching = played.findIndex((u, i) => chapter.moves[i] !== u);
  const onLine = matching === -1;
  const nextUci = onLine ? chapter.moves[game.ply] : undefined;
  const nextSan = nextUci ? (sanFromUci(fen, nextUci) ?? nextUci) : null;
  const finished = onLine && game.ply >= chapter.moves.length;
  const lessonSan = !onLine ? chapter.moves[matching] : null;

  const next = () => {
    if (!nextUci) return;
    if (game.moves[game.ply]?.uci === nextUci) redo();
    else playUci(nextUci);
  };
  const backToLesson = () => openStudy(study, chapterIdx, Math.max(0, matching));
  const go = (i: number) => {
    if (i >= 0 && i < study.chapters.length) openStudy(study, i);
  };

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold">{study.name}</h3>
          <a
            className="shrink-0 text-xs text-accent underline"
            href={chapter.url || study.url}
            target="_blank"
            rel="noreferrer"
          >
            {t('lesson.openLichess')}
          </a>
        </div>
        {study.author && (
          <p className="text-xs text-muted">
            {t('lesson.by')}{' '}
            <a
              className="underline"
              href={`https://lichess.org/@/${study.author}`}
              target="_blank"
              rel="noreferrer"
            >
              {study.author}
            </a>
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn-icon"
          onClick={() => go(chapterIdx - 1)}
          disabled={chapterIdx === 0}
          aria-label={t('lesson.prevChapter')}
        >
          <IconPrev />
        </button>
        <select
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm text-fg"
          value={chapterIdx}
          onChange={(e) => go(Number(e.target.value))}
          aria-label={t('lesson.chapter')}
        >
          {study.chapters.map((c, i) => (
            <option key={i} value={i}>
              {i + 1}. {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-icon"
          onClick={() => go(chapterIdx + 1)}
          disabled={chapterIdx >= study.chapters.length - 1}
          aria-label={t('lesson.nextChapter')}
        >
          <IconNext />
        </button>
      </div>

      <p className="text-xs text-muted">
        {t('lesson.chapter')} {chapterIdx + 1}/{study.chapters.length} · {t('home.moves')}{' '}
        {Math.min(game.ply, chapter.moves.length)}/{chapter.moves.length}
        {chapter.mode === 'gamebook' ? ' · gamebook' : ''}
      </p>

      <div className="card p-3">
        {text ? (
          <Paragraphs text={text} />
        ) : (
          <p className="text-muted">{finished ? t('lesson.end') : t('lesson.noText')}</p>
        )}
      </div>

      {!onLine && (
        <div className="card flex flex-wrap items-center gap-2 p-3 text-xs">
          <span className="text-muted">
            {t('lesson.deviated')}{' '}
            <strong className="text-fg">
              {lessonSan
                ? (sanFromUci(game.moves[matching - 1]?.fen ?? game.startFen, lessonSan) ??
                  lessonSan)
                : ''}
            </strong>
          </span>
          <button type="button" className="btn px-2.5 py-1.5 text-xs" onClick={backToLesson}>
            {t('lesson.back')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {nextSan && (
          <button type="button" className="btn btn-primary" onClick={next}>
            {t('lesson.next')}: {nextSan}
          </button>
        )}
        {finished && chapterIdx < study.chapters.length - 1 && (
          <button type="button" className="btn btn-primary" onClick={() => go(chapterIdx + 1)}>
            {t('lesson.nextChapter')}
          </button>
        )}
        <button type="button" className="btn" onClick={() => goToPly(0)} disabled={game.ply === 0}>
          {t('lesson.restart')}
        </button>
      </div>
      <p className="text-[11px] text-muted">{t('studies.credit')}</p>
    </div>
  );
}
