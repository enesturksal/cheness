import { describe, expect, it } from 'vitest';
import {
  applySan,
  applyUci,
  currentFen,
  destsFor,
  epdAfter,
  gameFromUciLine,
  isPromotionMove,
  movetext,
  newGame,
  sanFromUci,
  START_FEN,
  statusOf,
  toEpd,
  turnOf,
  uciFromSan,
} from './game';

describe('game', () => {
  it('starts from the standard position', () => {
    const g = newGame();
    expect(currentFen(g)).toBe(START_FEN);
    expect(turnOf(currentFen(g))).toBe('white');
    expect(destsFor(START_FEN).get('e2')).toEqual(['e3', 'e4']);
  });

  it('applies UCI and SAN moves and records EPD', () => {
    let g = applyUci(newGame(), 'e2e4')!;
    expect(g.moves[0].san).toBe('e4');
    g = applySan(g, 'c5')!;
    expect(g.ply).toBe(2);
    expect(g.moves[1].uci).toBe('c7c5');
    expect(g.moves[1].epd).toBe('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -');
    expect(toEpd(currentFen(g))).toBe(g.moves[1].epd);
    expect(epdAfter(START_FEN, 'e2e4')).toBe(g.moves[0].epd);
    expect(epdAfter(START_FEN, 'e2e5')).toBeNull();
  });

  it('rejects illegal moves', () => {
    expect(applyUci(newGame(), 'e2e5')).toBeNull();
    expect(applySan(newGame(), 'Nf6')).toBeNull();
  });

  it('truncates the future when playing from an earlier ply', () => {
    const g = gameFromUciLine(['e2e4', 'e7e5', 'g1f3'])!;
    const back = { ...g, ply: 1 };
    const branched = applyUci(back, 'c7c5')!;
    expect(branched.moves.map((m) => m.san)).toEqual(['e4', 'c5']);
    expect(branched.ply).toBe(2);
  });

  it('converts between SAN and UCI', () => {
    expect(uciFromSan(START_FEN, 'Nf3')).toBe('g1f3');
    expect(sanFromUci(START_FEN, 'g1f3')).toBe('Nf3');
    expect(sanFromUci(START_FEN, 'g1f4')).toBeNull();
  });

  it('detects promotions and game end', () => {
    const promoFen = '8/P7/8/8/8/8/8/k6K w - - 0 1';
    expect(isPromotionMove(promoFen, 'a7', 'a8')).toBe(true);
    const mate = gameFromUciLine(['f2f3', 'e7e5', 'g2g4', 'd8h4'])!;
    const s = statusOf(currentFen(mate));
    expect(s.over).toBe(true);
    expect(s.result).toBe('0-1');
    expect(s.reason).toBe('checkmate');
  });

  it('renders movetext', () => {
    const g = gameFromUciLine(['e2e4', 'c7c5', 'g1f3'])!;
    expect(movetext(g)).toBe('1. e4 c5 2. Nf3');
    expect(movetext(g, 2)).toBe('1. e4 c5');
  });
});
