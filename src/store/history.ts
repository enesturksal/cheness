import { useStore, type LibraryEntryRef, type View } from './useStore';

interface NavState {
  view: View;
  libraryFamily: string | null;
  libraryEntry: LibraryEntryRef | null;
}

const snapshot = (): NavState => {
  const s = useStore.getState();
  return { view: s.view, libraryFamily: s.libraryFamily, libraryEntry: s.libraryEntry };
};

const same = (a: NavState, b: NavState) =>
  a.view === b.view &&
  a.libraryFamily === b.libraryFamily &&
  (a.libraryEntry?.epd ?? null) === (b.libraryEntry?.epd ?? null) &&
  (a.libraryEntry?.name ?? null) === (b.libraryEntry?.name ?? null);

/**
 * Mirrors in-app navigation (view + library drill-down) into the browser history, so the
 * browser/Android back button and the top-bar back arrow step back one screen at a time.
 */
export function startHistorySync(): () => void {
  let applying = false;
  let last = snapshot();
  history.replaceState({ cheness: last }, '');

  const unsubscribe = useStore.subscribe(() => {
    if (applying) return;
    const now = snapshot();
    if (same(now, last)) return;
    last = now;
    history.pushState({ cheness: now }, '');
  });

  const onPop = (e: PopStateEvent) => {
    const st = (e.state as { cheness?: NavState } | null)?.cheness;
    if (!st) return;
    applying = true;
    last = st;
    useStore.setState({
      view: st.view,
      libraryFamily: st.libraryFamily ?? null,
      libraryEntry: st.libraryEntry ?? null,
      previewUci: null,
    });
    applying = false;
  };
  window.addEventListener('popstate', onPop);

  return () => {
    unsubscribe();
    window.removeEventListener('popstate', onPop);
  };
}

/** Go back one screen; falls back to the home screen when there is nothing to go back to. */
export function goBack(): void {
  const st = (history.state as { cheness?: NavState } | null)?.cheness;
  if (st && history.length > 1) history.back();
  else useStore.getState().setView('home');
}
