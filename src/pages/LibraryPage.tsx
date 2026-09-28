import { useMemo, useState } from 'react';
import { Board } from '../components/Board';
import {
  IconBack,
  IconChevron,
  IconFirst,
  IconLast,
  IconNext,
  IconPrev,
  IconSearch,
} from '../components/Icons';
import {
  familiesByVolume,
  familyOf,
  searchOpenings,
  VOLUMES,
  type BookEntry,
  type Family,
  type Volume,
} from '../explorer/book';
import { fenAt, gameFromUciLine, lastMoveSquares, movetext, statusOf, turnOf } from '../game/game';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';
import type { StringKey } from '../i18n/strings';

function EntryRow({
  e,
  onSelect,
  showFamily,
}: {
  e: BookEntry;
  onSelect: (e: BookEntry) => void;
  showFamily: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(e)}
      className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-bg3"
    >
      <span className="eco mt-0.5 shrink-0">{e.eco}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {showFamily || !e.variation ? e.name : e.variation}
        </span>
        <span className="block truncate font-mono text-[11px] text-muted">
          {movetext(gameFromUciLine(e.uci)!)}
        </span>
      </span>
    </button>
  );
}

function EntryDetail({
  entry,
  onBack,
  onSelect,
}: {
  entry: BookEntry;
  onBack: () => void;
  onSelect: (e: BookEntry) => void;
}) {
  const t = useT();
  const loadGame = useStore((s) => s.loadGame);
  // The parent keys this component by entry, so state resets naturally per opening.
  const game = useMemo(() => gameFromUciLine(entry.uci)!, [entry]);
  const [ply, setPly] = useState(game.moves.length);
  const view = { ...game, ply };
  const fen = fenAt(game, ply);
  const family = familyOf(entry.family);
  const related = (family?.entries ?? []).filter((e) => e !== entry).slice(0, 60);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-2 md:flex-row md:items-start md:p-4">
      <div className="w-full shrink-0 md:w-[min(48vw,calc(100dvh-9rem))]">
        <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-24rem))] md:max-w-none">
          <Board
            fen={fen}
            orientation="white"
            turnColor={turnOf(fen)}
            lastMove={lastMoveSquares(view)}
            check={statusOf(fen).check}
            viewOnly
          />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <button type="button" className="btn-icon" onClick={() => setPly(0)} disabled={ply === 0}>
            <IconFirst />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setPly((p) => Math.max(0, p - 1))}
            disabled={ply === 0}
          >
            <IconPrev />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setPly((p) => Math.min(game.moves.length, p + 1))}
            disabled={ply >= game.moves.length}
          >
            <IconNext />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setPly(game.moves.length)}
            disabled={ply >= game.moves.length}
          >
            <IconLast />
          </button>
        </div>
      </div>
      <div className="card min-w-0 flex-1 p-3">
        <button
          type="button"
          className="mb-2 flex items-center gap-1 text-sm text-muted"
          onClick={onBack}
        >
          <IconBack /> {t('library.back')}
        </button>
        <div className="flex items-center gap-2">
          <span className="eco">{entry.eco}</span>
          <h2 className="text-base font-bold">{entry.name}</h2>
        </div>
        <p className="mt-2 text-xs font-semibold tracking-wide text-muted uppercase">
          {t('library.line')}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-1 font-mono text-sm">
          {game.moves.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPly(i + 1)}
              className={`rounded px-1 ${ply === i + 1 ? 'bg-accent text-accent-fg' : 'hover:bg-bg3'}`}
            >
              {i % 2 === 0 ? `${i / 2 + 1}. ` : ''}
              {m.san}
            </button>
          ))}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => loadGame(entry.uci, { mode: 'bot', playerColor: 'white' })}
          >
            {t('library.practiceWhite')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => loadGame(entry.uci, { mode: 'bot', playerColor: 'black' })}
          >
            {t('library.practiceBlack')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => loadGame(entry.uci, { mode: 'explore' })}
          >
            {t('library.explore')}
          </button>
        </div>
        {related.length > 0 && (
          <>
            <p className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">
              {t('library.related')} ({family?.entries.length})
            </p>
            <div className="mt-1 max-h-[50dvh] overflow-y-auto">
              {related.map((e) => (
                <EntryRow key={e.epd + e.name} e={e} onSelect={onSelect} showFamily={false} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FamilyView({
  family,
  onBack,
  onSelect,
}: {
  family: Family;
  onBack: () => void;
  onSelect: (e: BookEntry) => void;
}) {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-3xl p-2 md:p-4">
      <button
        type="button"
        className="mb-2 flex items-center gap-1 text-sm text-muted"
        onClick={onBack}
      >
        <IconBack /> {t('library.back')}
      </button>
      <div className="flex items-center gap-2">
        <span className="eco">{family.ecoRange}</span>
        <h2 className="text-base font-bold">{family.name}</h2>
        <span className="text-xs text-muted">
          {family.entries.length} {t('library.variations')}
        </span>
      </div>
      <div className="card mt-2 p-1">
        {family.entries.map((e) => (
          <EntryRow key={e.epd + e.name} e={e} onSelect={onSelect} showFamily={false} />
        ))}
      </div>
    </div>
  );
}

export function LibraryPage() {
  const t = useT();
  const [query, setQuery] = useState('');
  // The Openings screen can ask for a family to be opened directly.
  const requested = useStore((s) => s.libraryFamily);
  const openLibraryFamily = useStore((s) => s.openLibraryFamily);
  const [family, setFamilyState] = useState<Family | null>(() =>
    requested ? (familyOf(requested) ?? null) : null,
  );
  const setFamily = (f: Family | null) => {
    if (requested) openLibraryFamily(null);
    setFamilyState(f);
  };
  const [entry, setEntry] = useState<BookEntry | null>(null);
  const [open, setOpen] = useState<Set<Volume>>(() => new Set());

  const results = useMemo(
    () => (query.trim().length >= 2 ? searchOpenings(query, 150) : null),
    [query],
  );

  if (entry) {
    return (
      <EntryDetail
        key={entry.epd + entry.name}
        entry={entry}
        onBack={() => setEntry(null)}
        onSelect={setEntry}
      />
    );
  }
  if (family)
    return <FamilyView family={family} onBack={() => setFamily(null)} onSelect={setEntry} />;

  const toggle = (v: Volume) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-3xl p-2 md:p-4">
      <h2 className="mb-2 text-lg font-bold">{t('library.title')}</h2>
      <label className="card flex items-center gap-2 px-3 py-2">
        <IconSearch />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('library.search')}
          className="w-full bg-transparent text-sm outline-none"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>

      {results ? (
        <div className="card mt-2 p-1">
          {results.length === 0 && (
            <p className="p-3 text-sm text-muted">{t('library.noResults')}</p>
          )}
          {results.map((e) => (
            <EntryRow key={e.epd + e.name} e={e} onSelect={setEntry} showFamily />
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {VOLUMES.map((v) => {
            const fams = familiesByVolume(v);
            const isOpen = open.has(v);
            const count = fams.reduce((n, f) => n + f.entries.length, 0);
            return (
              <div key={v} className="card">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                  onClick={() => toggle(v)}
                >
                  <span className="eco text-sm">{v}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">
                      {t(`library.volume.${v}` as StringKey)}
                    </span>
                    <span className="block text-xs text-muted">
                      {fams.length} {t('library.openings')} · {count} {t('library.variations')}
                    </span>
                  </span>
                  <IconChevron open={isOpen} />
                </button>
                {isOpen && (
                  <div className="border-t border-line p-1">
                    {fams.map((f) => (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => setFamily(f)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-bg3"
                      >
                        <span className="eco shrink-0">{f.ecoRange}</span>
                        <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                        <span className="shrink-0 text-xs text-muted">{f.entries.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
