import { describe, expect, it } from 'vitest';
import { theoryTitle, theoryUrl } from './wikibooks';

describe('wikibooks titles', () => {
  it('builds the page title for a line', () => {
    expect(theoryTitle([])).toBe('Chess Opening Theory');
    expect(theoryTitle(['e4'])).toBe('Chess Opening Theory/1. e4');
    expect(theoryTitle(['e4', 'c5', 'Nf3', 'd6', 'd4'])).toBe(
      'Chess Opening Theory/1. e4/1...c5/2. Nf3/2...d6/3. d4',
    );
  });

  it('builds a wiki url', () => {
    expect(theoryUrl('Chess Opening Theory/1. e4/1...c5')).toBe(
      'https://en.wikibooks.org/wiki/Chess_Opening_Theory/1._e4/1...c5',
    );
  });
});
