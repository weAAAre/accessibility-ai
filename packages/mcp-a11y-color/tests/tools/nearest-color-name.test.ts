import { describe, expect, it } from '@rstest/core';

import { executeNearestColorName } from '../../src/tools/nearest-color-name.js';

describe('executeNearestColorName', () => {
  it('returns expected structure', () => {
    const r = executeNearestColorName({ color: '#FF0000' });
    expect(r.input.hex).toBe('#ff0000');
    expect(r.matches).toBeDefined();
    expect(r.matches.length).toBeGreaterThan(0);
    expect(r.matches[0].name).toBeDefined();
    expect(r.matches[0].hex).toBeDefined();
    expect(r.matches[0].deltaE).toBeDefined();
  });

  it('exact match for red → deltaE = 0', () => {
    const r = executeNearestColorName({ color: '#FF0000' });
    expect(r.matches[0].name).toBe('red');
    expect(r.matches[0].deltaE).toBe(0);
  });

  it('exact match for named CSS colors', () => {
    const exactCases = ['red', 'blue', 'green', 'white', 'black', 'orange', 'navy'];
    for (const name of exactCases) {
      const r = executeNearestColorName({ color: name, count: 1 });
      expect(r.matches[0].name.toLowerCase()).toBe(name);
      expect(r.matches[0].deltaE).toBe(0);
    }
  });

  it('near match: #FE0000 closest to red', () => {
    const r = executeNearestColorName({ color: '#FE0000', count: 1 });
    expect(r.matches[0].name).toBe('red');
    expect(r.matches[0].deltaE).toBeGreaterThan(0);
    expect(r.matches[0].deltaE).toBeLessThan(5);
  });

  it('default count returns 3 matches', () => {
    const r = executeNearestColorName({ color: '#445566' });
    expect(r.matches).toHaveLength(3);
  });

  it('count=1 returns exactly 1', () => {
    const r = executeNearestColorName({ color: '#FF0000', count: 1 });
    expect(r.matches).toHaveLength(1);
  });

  it('count=10 returns exactly 10', () => {
    const r = executeNearestColorName({ color: '#FF0000', count: 10 });
    expect(r.matches).toHaveLength(10);
  });

  it('results are sorted by deltaE ascending', () => {
    const r = executeNearestColorName({ color: '#446688', count: 5 });
    for (let i = 1; i < r.matches.length; i++) {
      expect(r.matches[i].deltaE).toBeGreaterThanOrEqual(r.matches[i - 1].deltaE);
    }
  });

  it('accepts hsl() input', () => {
    const r = executeNearestColorName({ color: 'hsl(0, 100%, 50%)' });
    expect(r.matches[0].name).toBe('red');
    expect(r.matches[0].deltaE).toBe(0);
  });

  it('hex values are lowercase', () => {
    const r = executeNearestColorName({ color: '#FF0000', count: 5 });
    for (const m of r.matches) {
      expect(m.hex).toBe(m.hex.toLowerCase());
    }
  });
});
