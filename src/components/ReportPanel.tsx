import { useMemo } from 'react';
import { gameReport, KIND_LABEL_KEY, type MoveKind } from '../engine/analysis';
import { currentFen, turnOf } from '../game/game';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import { KindBadge } from './KindBadge';

const ORDER: MoveKind[] = [
  'best',
  'great',
  'excellent',
  'good',
  'book',
  'inaccuracy',
  'mistake',
  'blunder',
];
const REVIEW: MoveKind[] = ['inaccuracy', 'mistake', 'blunder'];

/** Accuracy per side, verdict counts and the moves worth reviewing. */
export function ReportPanel() {
  const t = useT();
  const game = useStore((s) => s.game);
  const annotations = useStore((s) => s.annotations);
  const analysisDepth = useStore((s) => s.analysisDepth);
  const setSettings = useStore((s) => s.setSettings);
  const goToPly = useStore((s) => s.goToPly);
  const loadGame = useStore((s) => s.loadGame);

  const report = useMemo(
    () =>
      gameReport(
        annotations,
        game.moves.map((m) => m.color),
      ),
    [annotations, game],
  );
  const analysed = annotations.filter(Boolean).length;
  const cloud = annotations.filter((a) => a?.source === 'cloud').length;
  const issues = game.moves
    .map((m, i) => ({ m, i, a: annotations[i] }))
    .filter((x) => x.a && REVIEW.includes(x.a.kind));

  if (analysisDepth === 0) {
    return (
      <div className="space-y-3 p-3 text-sm text-muted">
        <p>{t('analysis.hint')}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setSettings({ analysisDepth: 14 })}
        >
          {t('analysis.balanced')}
        </button>
      </div>
    );
  }
  if (game.moves.length === 0) return <p className="p-3 text-sm text-muted">{t('moves.empty')}</p>;

  return (
    <div className="flex flex-col gap-3 p-3">
      {analysed < game.moves.length && (
        <p className="text-xs text-muted">
          {t('report.analysing')} {analysed}/{game.moves.length}…
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(['white', 'black'] as const).map((c) => {
          const r = report[c];
          return (
            <div key={c} className="card p-3">
              <div className="text-xs font-semibold tracking-wide text-muted uppercase">
                {t(c === 'white' ? 'side.white' : 'side.black')}
              </div>
              <div className="mt-1 text-2xl font-bold">
                {r.accuracy === null ? '—' : `${r.accuracy}%`}
                <span className="ml-1 text-xs font-normal text-muted">{t('report.accuracy')}</span>
              </div>
              <ul className="mt-2 space-y-0.5 text-xs">
                {ORDER.filter((k) => r.counts[k] > 0).map((k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <KindBadge kind={k} />
                    <span className="flex-1">{t(KIND_LABEL_KEY[k])}</span>
                    <span className="font-mono">{r.counts[k]}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {cloud > 0 && (
        <p className="text-[11px] text-muted">
          {t('report.cloud')} {cloud} {t('report.moves')}
        </p>
      )}

      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
        {t('report.mistakes')}
      </h3>
      {issues.length === 0 ? (
        <p className="text-xs text-muted">{t('report.noMistakes')}</p>
      ) : (
        <div className="space-y-0.5">
          {issues.map(({ m, i, a }) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPly(i + 1)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-bg3 ${
                game.ply === i + 1 ? 'bg-bg3' : ''
              }`}
            >
              <span className="w-10 shrink-0 font-mono text-xs text-muted">
                {Math.floor(i / 2) + 1}.{i % 2 ? '..' : ''}
              </span>
              <span className="w-14 shrink-0 font-semibold">{m.san}</span>
              <KindBadge kind={a!.kind} />
              <span className="flex-1 truncate text-xs text-muted">
                {t(KIND_LABEL_KEY[a!.kind])}
                {a!.bestSan ? ` · ${t('analysis.bestWas')} ${a!.bestSan}` : ''}
              </span>
              <span className="shrink-0 text-xs text-muted">−{a!.loss}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn self-start"
        onClick={() =>
          loadGame(
            game.moves.slice(0, game.ply).map((m) => m.uci),
            { mode: 'bot', playerColor: turnOf(currentFen(game)) },
          )
        }
      >
        {t('report.retry')}
      </button>
    </div>
  );
}
