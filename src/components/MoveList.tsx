import { useEffect, useRef } from 'react';
import { moveNumberOf, turnOf } from '../game/game';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';

interface Row {
  no: number;
  white?: { san: string; ply: number };
  black?: { san: string; ply: number };
}

export function MoveList() {
  const t = useT();
  const game = useStore((s) => s.game);
  const goToPly = useStore((s) => s.goToPly);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current
      ?.querySelector('[data-current="true"]')
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [game.ply]);

  if (game.moves.length === 0) {
    return <p className="p-3 text-sm text-muted">{t('moves.empty')}</p>;
  }

  const rows: Row[] = [];
  let no = moveNumberOf(game.startFen);
  let whiteNext = turnOf(game.startFen) === 'white';
  game.moves.forEach((m, i) => {
    const ply = i + 1;
    if (whiteNext) {
      rows.push({ no, white: { san: m.san, ply } });
    } else {
      const last = rows[rows.length - 1];
      if (last && !last.black) last.black = { san: m.san, ply };
      else rows.push({ no, black: { san: m.san, ply } });
      no += 1;
    }
    whiteNext = !whiteNext;
  });

  const cell = (mv: { san: string; ply: number } | undefined) => {
    if (!mv) return <span className="px-2 py-1 text-muted">…</span>;
    const current = mv.ply === game.ply;
    return (
      <button
        type="button"
        data-current={current}
        onClick={() => goToPly(mv.ply)}
        className={`rounded px-2 py-1 text-left font-medium hover:bg-bg3 ${
          current ? 'bg-accent text-accent-fg hover:bg-accent' : ''
        }`}
      >
        {mv.san}
      </button>
    );
  };

  return (
    <div ref={ref} className="grid grid-cols-[auto_1fr_1fr] gap-x-1 gap-y-0.5 p-2 text-sm">
      {rows.map((r) => (
        <div key={r.no} className="contents">
          <span className="px-1 py-1 text-right font-mono text-xs text-muted">{r.no}.</span>
          {cell(r.white)}
          {cell(r.black)}
        </div>
      ))}
    </div>
  );
}
