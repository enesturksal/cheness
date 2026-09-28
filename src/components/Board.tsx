import { useEffect, useRef, useState } from 'react';
import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { Config } from '@lichess-org/chessground/config';
import type { DrawShape } from '@lichess-org/chessground/draw';
import type { DrawBrushes } from '@lichess-org/chessground/draw';
import { defaults } from '@lichess-org/chessground/state';
import type { Key } from '@lichess-org/chessground/types';
import type { Square } from 'chess.js';
import { isPromotionMove, type Color } from '../game/game';
import { PromotionPicker } from './PromotionPicker';

/**
 * Arrow brushes: popular continuations fade with rank (most played = strongest), engine
 * suggestions are blue, the tapped preview is yellow (chessground default).
 */
const BRUSHES: DrawBrushes = {
  ...defaults().drawable.brushes,
  pop1: { key: 'pop1', color: '#15781B', opacity: 0.95, lineWidth: 11 },
  pop2: { key: 'pop2', color: '#15781B', opacity: 0.55, lineWidth: 9 },
  pop3: { key: 'pop3', color: '#15781B', opacity: 0.3, lineWidth: 8 },
  eng1: { key: 'eng1', color: '#0f5fd6', opacity: 0.9, lineWidth: 11 },
  eng2: { key: 'eng2', color: '#0f5fd6', opacity: 0.5, lineWidth: 9 },
  eng3: { key: 'eng3', color: '#0f5fd6', opacity: 0.28, lineWidth: 8 },
};

export interface BoardProps {
  fen: string;
  orientation: Color;
  turnColor: Color;
  lastMove?: [Square, Square];
  check?: boolean;
  /** Legal destinations; omit to make the board read-only. */
  dests?: Map<Square, Square[]>;
  /** Which side the user may move; omit for read-only. */
  movableColor?: Color | 'both';
  onMove?: (uci: string) => void;
  autoShapes?: DrawShape[];
  autoQueen?: boolean;
  viewOnly?: boolean;
}

interface PendingPromotion {
  from: Square;
  to: Square;
  /** Position the promotion belongs to; it is dropped as soon as the position changes. */
  fen: string;
}

function toConfig(p: BoardProps): Config {
  return {
    fen: p.fen,
    orientation: p.orientation,
    turnColor: p.turnColor,
    lastMove: p.lastMove,
    check: p.check ?? false,
    viewOnly: p.viewOnly ?? false,
    movable: {
      free: false,
      color: p.viewOnly ? undefined : p.movableColor,
      dests: (p.viewOnly ? new Map() : (p.dests ?? new Map())) as Map<Key, Key[]>,
      showDests: true,
    },
  };
}

/** React wrapper around chessground. The instance is created once and reconfigured on change. */
export function Board(props: BoardProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });
  const [promo, setPromo] = useState<PendingPromotion | null>(null);
  const activePromo = promo && promo.fen === props.fen ? promo : null;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const initial = toConfig(propsRef.current);
    const api = Chessground(el, {
      ...initial,
      coordinates: true,
      disableContextMenu: true,
      blockTouchScroll: true,
      addDimensionsCssVarsTo: el,
      animation: { enabled: true, duration: 180 },
      highlight: { lastMove: true, check: true },
      premovable: { enabled: false },
      draggable: { enabled: true, showGhost: true },
      drawable: {
        enabled: false,
        visible: true,
        autoShapes: propsRef.current.autoShapes ?? [],
        brushes: BRUSHES,
      },
      movable: {
        ...initial.movable,
        events: {
          after: (orig, dest) => {
            const p = propsRef.current;
            if (!p.onMove) return;
            const from = orig as Square;
            const to = dest as Square;
            if (isPromotionMove(p.fen, from, to)) {
              if (p.autoQueen) p.onMove(`${from}${to}q`);
              else setPromo({ from, to, fen: p.fen });
              return;
            }
            p.onMove(from + to);
          },
        },
      },
    });
    apiRef.current = api;
    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, []);

  const { fen, orientation, turnColor, lastMove, check, dests, movableColor, viewOnly } = props;
  useEffect(() => {
    apiRef.current?.set(toConfig(propsRef.current));
  }, [fen, orientation, turnColor, lastMove, check, dests, movableColor, viewOnly]);

  const { autoShapes } = props;
  useEffect(() => {
    apiRef.current?.setAutoShapes(autoShapes ?? []);
  }, [autoShapes]);

  return (
    <div className="board-wrap">
      <div ref={elRef} />
      {activePromo && (
        <PromotionPicker
          color={turnColor}
          onPick={(piece) => {
            const { from, to } = activePromo;
            setPromo(null);
            propsRef.current.onMove?.(`${from}${to}${piece}`);
          }}
          onCancel={() => {
            setPromo(null);
            // Snap the dragged pawn back.
            apiRef.current?.set(toConfig(propsRef.current));
          }}
        />
      )}
    </div>
  );
}
