import { useEffect, useMemo, useState } from 'react';
import { IconChevron } from '../components/Icons';
import { Wdl } from '../components/OpeningPanel';
import { POPULAR_BLACK, POPULAR_WHITE, type PopularOpening } from '../data/popularOpenings';
import { movePercent } from '../explorer/api';
import { families, familyOf, lookupEpd, normalizeText, type Family } from '../explorer/book';
import { fetchExplorerCached } from '../explorer/fetchCached';
import { startLogin } from '../explorer/lichessAuth';
import type { ExplorerMove, ExplorerResponse } from '../explorer/types';
import { epdAfter, movetextOfUciLine, START_FEN, toEpd, type Color } from '../game/game';
import { useT } from '../i18n/useT';
import { useStore, type Mode } from '../store/useStore';

/* ------------------------------------------------------------------ shared bits */

function LineButtons({ line, onFamily }: { line: string[]; onFamily?: string }) {
  const t = useT();
  const loadGame = useStore((s) => s.loadGame);
  const openFamily = useStore((s) => s.openLibraryFamily);
  const family = onFamily ? familyOf(onFamily) : undefined;
  const go = (mode: Mode, color: Color) => loadGame(line, { mode, playerColor: color });
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        className="btn btn-primary px-2.5 py-1.5 text-xs"
        onClick={() => go('bot', 'white')}
      >
        ♔ {t('openings.practice')}
      </button>
      <button
        type="button"
        className="btn btn-primary px-2.5 py-1.5 text-xs"
        onClick={() => go('bot', 'black')}
      >
        ♚ {t('openings.practice')}
      </button>
      <button
        type="button"
        className="btn px-2.5 py-1.5 text-xs"
        onClick={() => go('explore', 'white')}
      >
        {t('openings.explore')}
      </button>
      {family && (
        <button
          type="button"
          className="btn px-2.5 py-1.5 text-xs"
          onClick={() => openFamily(family.name)}
        >
          {family.entries.length} {t('openings.variations')}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ live tree (needs token) */

interface LiveNode {
  line: string[];
  move: ExplorerMove;
  share: number;
  epd: string;
}

function nodesOf(line: string[], epd: string, data: ExplorerResponse, limit: number): LiveNode[] {
  return data.moves.slice(0, limit).map((m) => ({
    line: [...line, m.uci],
    move: m,
    share: Math.round(movePercent(m, data)),
    epd: epdAfter(fenOf(epd), m.uci) ?? '',
  }));
}

function fenOf(epd: string): string {
  return `${epd} 0 1`;
}

function nameOf(node: LiveNode): string {
  return node.move.opening?.name ?? lookupEpd(node.epd)?.name ?? '';
}

function LiveRow({ node, depth, token }: { node: LiveNode; depth: number; token: string }) {
  const t = useT();
  const ratings = useStore((s) => s.ratings);
  const speeds = useStore((s) => s.speeds);
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<LiveNode[] | null>(null);
  const [loading, setLoading] = useState(false);

  const expand = async () => {
    setOpen((v) => !v);
    if (children || loading || depth >= 4) return;
    setLoading(true);
    const data = await fetchExplorerCached(
      { db: 'lichess', epd: node.epd, ratings, speeds },
      token,
    );
    setChildren(data ? nodesOf(node.line, node.epd, data, 5) : []);
    setLoading(false);
  };

  const name = nameOf(node);
  return (
    <div className={depth > 1 ? 'ml-3 border-l border-line pl-2' : ''}>
      <div className="flex items-center gap-2 py-1.5">
        <button
          type="button"
          className="btn-icon px-1.5"
          onClick={() => void expand()}
          aria-expanded={open}
        >
          <IconChevron open={open} />
        </button>
        <span className="w-12 shrink-0 font-semibold">{node.move.san}</span>
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
          {node.share}%
        </span>
        <div className="min-w-0 flex-1">
          <Wdl white={node.move.white} draws={node.move.draws} black={node.move.black} />
          <div className="truncate text-[11px] text-muted">
            {node.move.opening?.eco ? `${node.move.opening.eco} · ` : ''}
            {name}
          </div>
        </div>
      </div>
      {open && (
        <div className="mb-2 flex flex-col gap-2 pl-8">
          <LineButtons line={node.line} onFamily={name.split(':')[0]} />
          {loading && <p className="text-xs text-muted">{t('openings.loading')}</p>}
          {children && children.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                {t('openings.replies')}
              </p>
              {children.map((c) => (
                <LiveRow key={c.move.uci} node={c} depth={depth + 1} token={token} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LiveTree({ token }: { token: string }) {
  const t = useT();
  const ratings = useStore((s) => s.ratings);
  const speeds = useStore((s) => s.speeds);
  // Results are tagged with the query they belong to, so a filter change shows "loading"
  // without an extra setState in the effect body.
  const key = `${token}|${ratings.join(',')}|${speeds.join(',')}`;
  const [loaded, setLoaded] = useState<{ key: string; nodes: LiveNode[] } | null>(null);
  const root = loaded && loaded.key === key ? loaded.nodes : null;

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const epd = toEpd(START_FEN);
      const data = await fetchExplorerCached(
        { db: 'lichess', epd, ratings, speeds },
        token,
        ctrl.signal,
      );
      if (!ctrl.signal.aborted) setLoaded({ key, nodes: data ? nodesOf([], epd, data, 6) : [] });
    })();
    return () => ctrl.abort();
  }, [key, token, ratings, speeds]);

  return (
    <section className="card p-3">
      <h3 className="text-sm font-bold">{t('openings.live')}</h3>
      <p className="mb-2 text-xs text-muted">{t('openings.liveDesc')}</p>
      {root === null && <p className="text-xs text-muted">{t('openings.loading')}</p>}
      {root?.map((n) => (
        <LiveRow key={n.move.uci} node={n} depth={1} token={token} />
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ curated + all families */

function PopularCard({ o }: { o: PopularOpening }) {
  return (
    <div className="card flex flex-col gap-2 p-3">
      <div className="flex items-start gap-2">
        <span className="eco mt-0.5">{o.eco}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">{o.family}</h3>
          <p className="truncate font-mono text-[11px] text-muted">{movetextOfUciLine(o.line)}</p>
        </div>
      </div>
      <LineButtons line={o.line} onFamily={o.family} />
    </div>
  );
}

function FamilyRow({ f }: { f: Family }) {
  const [open, setOpen] = useState(false);
  const main = f.entries[0];
  return (
    <div className="border-t border-line">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2 py-2 text-left hover:bg-bg3"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="eco shrink-0">{f.ecoRange}</span>
        <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
        <span className="shrink-0 text-xs text-muted">{f.entries.length}</span>
        <IconChevron open={open} />
      </button>
      {open && main && (
        <div className="flex flex-col gap-2 px-2 pb-3">
          <p className="truncate font-mono text-[11px] text-muted">{movetextOfUciLine(main.uci)}</p>
          <LineButtons line={main.uci} onFamily={f.name} />
        </div>
      )}
    </div>
  );
}

/** Most played openings: live Lichess tree when logged in, the curated shortlist, and every family in the book. */
export function OpeningsPage() {
  const t = useT();
  const token = useStore((s) => s.lichessToken);
  const setPanelTab = useStore((s) => s.setPanelTab);
  const setView = useStore((s) => s.setView);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const allFamilies = useMemo(
    () => [...families()].sort((a, b) => b.entries.length - a.entries.length),
    [],
  );
  const filtered = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return allFamilies;
    return allFamilies.filter(
      (f) => normalizeText(f.name).includes(q) || f.ecoRange.toLowerCase().includes(q),
    );
  }, [allFamilies, query]);
  const visible = query || showAll ? filtered : filtered.slice(0, 40);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-3 md:p-6">
      <h2 className="text-lg font-bold">{t('home.openings')}</h2>

      {token ? (
        <LiveTree token={token} />
      ) : (
        <div className="card flex flex-col gap-2 p-3 text-xs text-muted">
          <p>{t('openings.loginHint')}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void startLogin()}>
              {t('lichess.login')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setPanelTab('settings');
                setView('play');
              }}
            >
              {t('lichess.tokenLabel')}
            </button>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
          {t('openings.white')}
        </h3>
        <div className="grid gap-2 md:grid-cols-2">
          {POPULAR_WHITE.map((o) => (
            <PopularCard key={o.family} o={o} />
          ))}
        </div>
        <h3 className="mt-2 text-xs font-semibold tracking-wide text-muted uppercase">
          {t('openings.black')}
        </h3>
        <div className="grid gap-2 md:grid-cols-2">
          {POPULAR_BLACK.map((o) => (
            <PopularCard key={o.family} o={o} />
          ))}
        </div>
      </section>

      <section className="card p-1">
        <div className="p-2">
          <h3 className="text-sm font-bold">{t('openings.all')}</h3>
          <p className="text-xs text-muted">
            {t('openings.allDesc')} ({allFamilies.length})
          </p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('library.search')}
            className="mt-2 w-full rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm"
          />
        </div>
        {visible.map((f) => (
          <FamilyRow key={f.name} f={f} />
        ))}
        {!query && !showAll && filtered.length > 40 && (
          <button
            type="button"
            className="w-full border-t border-line py-2 text-xs text-accent"
            onClick={() => setShowAll(true)}
          >
            +{filtered.length - 40}
          </button>
        )}
      </section>
    </div>
  );
}
