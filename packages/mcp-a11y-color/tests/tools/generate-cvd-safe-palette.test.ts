import { describe, expect, it } from '@rstest/core';

import { executeGenerateCvdSafePalette } from '../../src/tools/generate-cvd-safe-palette.js';

describe('executeGenerateCvdSafePalette', () => {
  it('returns the requested number of colors', () => {
    const r = executeGenerateCvdSafePalette({ count: 5 });
    expect(r.palette).toHaveLength(5);
    expect(r.count).toBe(5);
  });

  it('palette colors are valid RGB', () => {
    const r = executeGenerateCvdSafePalette({ count: 3 });
    for (const c of r.palette) {
      expect(c.rgb.r).toBeGreaterThanOrEqual(0);
      expect(c.rgb.r).toBeLessThanOrEqual(255);
      expect(c.rgb.g).toBeGreaterThanOrEqual(0);
      expect(c.rgb.g).toBeLessThanOrEqual(255);
      expect(c.rgb.b).toBeGreaterThanOrEqual(0);
      expect(c.rgb.b).toBeLessThanOrEqual(255);
    }
  });

  it('palette colors have valid hex', () => {
    const r = executeGenerateCvdSafePalette({ count: 4 });
    for (const c of r.palette) {
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('pairAnalysis has C(n,2) pairs', () => {
    const n = 4;
    const r = executeGenerateCvdSafePalette({ count: n });
    const expectedPairs = (n * (n - 1)) / 2;
    expect(r.pairAnalysis).toHaveLength(expectedPairs);
  });

  it('each pair has normalDeltaE, worstCvdDeltaE, worstCvdType', () => {
    const r = executeGenerateCvdSafePalette({ count: 3 });
    for (const pair of r.pairAnalysis) {
      expect(typeof pair.normalDeltaE).toBe('number');
      expect(typeof pair.worstCvdDeltaE).toBe('number');
      expect(typeof pair.worstCvdType).toBe('string');
      expect(pair.color1).toMatch(/^#[0-9a-f]{6}$/);
      expect(pair.color2).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('3-color palette has reasonable CVD delta E', () => {
    const r = executeGenerateCvdSafePalette({ count: 3 });
    for (const pair of r.pairAnalysis) {
      expect(pair.worstCvdDeltaE).toBeGreaterThan(0);
    }
  });

  it('larger palettes may have lower worst-case deltaE', () => {
    const r3 = executeGenerateCvdSafePalette({ count: 3 });
    const r6 = executeGenerateCvdSafePalette({ count: 6 });
    const min3 = Math.min(...r3.pairAnalysis.map((p) => p.worstCvdDeltaE));
    const min6 = Math.min(...r6.pairAnalysis.map((p) => p.worstCvdDeltaE));
    expect(min3).toBeGreaterThanOrEqual(min6);
  });

  it('2 colors → 1 pair', () => {
    const r = executeGenerateCvdSafePalette({ count: 2 });
    expect(r.pairAnalysis).toHaveLength(1);
  });

  it('worstCvdDeltaE ≤ normalDeltaE for each pair', () => {
    const r = executeGenerateCvdSafePalette({ count: 4 });
    for (const pair of r.pairAnalysis) {
      expect(pair.worstCvdDeltaE).toBeLessThanOrEqual(pair.normalDeltaE + 0.01);
    }
  });

  it('results are deterministic (same inputs → same output)', () => {
    const a = executeGenerateCvdSafePalette({ count: 3 });
    const b = executeGenerateCvdSafePalette({ count: 3 });
    expect(a.palette.map((c) => c.hex)).toEqual(b.palette.map((c) => c.hex));
  });

  it('first color is based on hue 220 (deep blue region)', () => {
    const r = executeGenerateCvdSafePalette({ count: 3 });
    const firstRgb = r.palette[0].rgb;
    expect(firstRgb.b).toBeGreaterThan(firstRgb.r);
    expect(firstRgb.b).toBeGreaterThan(firstRgb.g);
  });

  it('normalDeltaE values are non-zero', () => {
    const r = executeGenerateCvdSafePalette({ count: 3 });
    for (const pair of r.pairAnalysis) {
      expect(pair.normalDeltaE).toBeGreaterThan(0);
    }
  });

  it('globalMinDeltaE equals minimum worstCvdDeltaE across all pairs', () => {
    const r = executeGenerateCvdSafePalette({ count: 4 });
    const minWorst = Math.min(...r.pairAnalysis.map((p) => p.worstCvdDeltaE));
    expect(r.summary.globalMinDeltaE).toBeCloseTo(minWorst, 2);
  });

  it('summary includes meetsThreshold flag', () => {
    const r = executeGenerateCvdSafePalette({ count: 3, minDeltaE: 10 });
    expect(typeof r.summary.meetsThreshold).toBe('boolean');
    expect(r.summary.threshold).toBe(10);
  });
});
