import { useCallback, useRef } from 'react';

const LONG_PRESS_MS = 500;

/**
 * Pointer handlers distinguishing a tap from a long press. The click handler is skipped
 * when a long press fired.
 */
export function useLongPress(onLongPress: () => void, onClick: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const onPointerDown = useCallback(() => {
    fired.current = false;
    clear();
    timer.current = setTimeout(() => {
      fired.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }, [clear, onLongPress]);

  const handleClick = useCallback(() => {
    if (fired.current) {
      fired.current = false;
      return;
    }
    onClick();
  }, [onClick]);

  return {
    onPointerDown,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
    onClick: handleClick,
  };
}
