import { describe, expect, it } from '@rstest/core';

import { executeAnalyzePaletteContrast } from '../../src/tools/analyze-palette-contrast.js';

describe('executeAnalyzePaletteContrast', () => {
  it('2-color palette: black + white → 100% passing', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'black', value: '#000000' },
        { name: 'white', value: '#FFFFFF' },
      ],
      level: 'AA',
    });
    expect(r.summary.totalPairs).toBe(2);
    expect(r.summary.passingPairs).toBe(2);
    expect(r.summary.failingPairs).toBe(0);
    expect(r.summary.passRate).toBe('100%');
  });

  it('N colors → N×(N-1) ordered pairs', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'a', value: '#000' },
        { name: 'b', value: '#FFF' },
        { name: 'c', value: '#888' },
      ],
      level: 'AA',
    });
    expect(r.summary.totalPairs).toBe(6);
  });

  it('4 colors → 12 pairs', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'a', value: '#111' },
        { name: 'b', value: '#444' },
        { name: 'c', value: '#888' },
        { name: 'd', value: '#FFF' },
      ],
      level: 'AA',
    });
    expect(r.summary.totalPairs).toBe(12);
  });

  it('failures include correct WCAG booleans', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'a', value: '#FFFFFF' },
        { name: 'b', value: '#FEFEFE' },
      ],
      level: 'AA',
    });
    expect(r.summary.failingPairs).toBe(2);
    const failingPairs = r.pairs.filter((p) => !p.AA_normal);
    expect(failingPairs.length).toBe(2);
    for (const pair of failingPairs) {
      expect(pair.ratio).toBeLessThan(4.5);
    }
  });

  it('AAA has more failures than AA for mid-contrast palette', () => {
    const colors = [
      { name: 'a', value: '#000' },
      { name: 'b', value: '#555' },
      { name: 'c', value: '#999' },
      { name: 'd', value: '#FFF' },
    ];
    const aa = executeAnalyzePaletteContrast({ colors, level: 'AA' });
    const aaa = executeAnalyzePaletteContrast({ colors, level: 'AAA' });
    expect(aaa.summary.failingPairs).toBeGreaterThanOrEqual(aa.summary.failingPairs);
  });

  it('each pair has WCAG booleans and ratio', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'a', value: '#000' },
        { name: 'b', value: '#FFF' },
      ],
      level: 'AA',
    });
    for (const pair of r.pairs) {
      expect(typeof pair.AA_normal).toBe('boolean');
      expect(typeof pair.AA_large).toBe('boolean');
      expect(typeof pair.AAA_normal).toBe('boolean');
      expect(typeof pair.AAA_large).toBe('boolean');
      expect(typeof pair.AA_ui).toBe('boolean');
      expect(typeof pair.ratio).toBe('number');
    }
  });

  it('black ↔ white: all 2 ordered pairs pass AA', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'black', value: 'black' },
        { name: 'white', value: 'white' },
      ],
      level: 'AA',
    });
    expect(r.summary.passingPairs).toBe(2);
    expect(r.summary.failingPairs).toBe(0);
  });

  it('similar colors: all ordered pairs fail AA', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'a', value: '#808080' },
        { name: 'b', value: '#858585' },
      ],
      level: 'AA',
    });
    expect(r.summary.passingPairs).toBe(0);
    expect(r.summary.failingPairs).toBe(2);
  });

  it('passing + failing = total', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'a', value: '#000' },
        { name: 'b', value: '#555' },
        { name: 'c', value: '#AAA' },
        { name: 'd', value: '#FFF' },
      ],
      level: 'AA',
    });
    expect(r.summary.passingPairs + r.summary.failingPairs).toBe(r.summary.totalPairs);
  });

  it('foreground/background are name strings', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'primary', value: '#F00' },
        { name: 'secondary', value: '#0F0' },
        { name: 'accent', value: '#00F' },
      ],
      level: 'AA',
    });
    for (const pair of r.pairs) {
      expect(typeof pair.foreground).toBe('string');
      expect(typeof pair.background).toBe('string');
    }
  });
});
