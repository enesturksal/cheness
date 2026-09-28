import { describe, expect, it } from 'vitest';
import { classify, formatScore, negateScore, scoreToCp, winPercent } from './analysis';

const cp = (n: number) => ({ cp: n, mate: null });
const mate = (n: number) => ({ cp: null, mate: n });

describe('win probability', () => {
  it('is symmetric around 50', () => {
    expect(winPercent(0)).toBeCloseTo(50, 5);
    expect(winPercent(100) + winPercent(-100)).toBeCloseTo(100, 5);
    expect(winPercent(300)).toBeCloseTo(75.1, 0);
    expect(winPercent(-1000)).toBeLessThan(5);
  });

  it('collapses mates and negates scores', () => {
    expect(scoreToCp(mate(3))).toBeGreaterThan(scoreToCp(cp(900)));
    expect(scoreToCp(mate(-1))).toBeLessThan(scoreToCp(cp(-900)));
    expect(negateScore(mate(2))).toEqual(mate(-2));
    expect(negateScore(cp(-35))).toEqual(cp(35));
    expect(negateScore({ cp: null, mate: null })).toEqual({ cp: null, mate: null });
  });

  it('formats scores', () => {
    expect(formatScore(cp(34))).toBe('+0.3');
    expect(formatScore(cp(-170))).toBe('-1.7');
    expect(formatScore(mate(3))).toBe('#3');
    expect(formatScore(mate(-2))).toBe('#-2');
  });
});

describe('classify', () => {
  const base = { uci: 'e2e4', bestMove: 'd2d4', inBook: false };

  it('marks book moves regardless of eval', () => {
    expect(classify({ ...base, before: cp(30), after: cp(-200), inBook: true }).kind).toBe('book');
  });

  it('marks the engine move as best, or great when the alternative is much worse', () => {
    expect(classify({ ...base, uci: 'd2d4', before: cp(30), after: cp(30) }).kind).toBe('best');
    expect(
      classify({ ...base, uci: 'd2d4', before: cp(30), after: cp(30), secondBest: cp(-400) }).kind,
    ).toBe('great');
    expect(
      classify({ ...base, uci: 'd2d4', before: cp(30), after: cp(30), secondBest: cp(10) }).kind,
    ).toBe('best');
  });

  it('bands other moves by win-probability loss', () => {
    // From +30 (52.8% win): 0 -> 50.0%, -40 -> 46.3%, -130 -> 38.2%, -260 -> 27.7%.
    expect(classify({ ...base, before: cp(30), after: cp(25) }).kind).toBe('excellent');
    expect(classify({ ...base, before: cp(30), after: cp(0) }).kind).toBe('good');
    expect(classify({ ...base, before: cp(30), after: cp(-40) }).kind).toBe('inaccuracy');
    expect(classify({ ...base, before: cp(30), after: cp(-130) }).kind).toBe('mistake');
    expect(classify({ ...base, before: cp(30), after: cp(-260) }).kind).toBe('blunder');
    expect(classify({ ...base, before: cp(30), after: mate(-4) }).kind).toBe('blunder');
  });

  it('never reports negative loss', () => {
    expect(classify({ ...base, before: cp(0), after: cp(50) }).loss).toBe(0);
  });
});
