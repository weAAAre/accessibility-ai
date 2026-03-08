import { describe, expect, it } from '@rstest/core';

import { parseColor } from '../../src/lib/color-parser.js';
import { contrastRatio, roundRatio } from '../../src/lib/contrast.js';
import { executeFindAccessibleColor } from '../../src/tools/find-accessible-color.js';

describe('executeFindAccessibleColor', () => {
  it('gray on white for AA (4.5:1)', () => {
    const r = executeFindAccessibleColor({ background: '#FFFFFF', targetRatio: 4.5 });
    expect(r.suggestedColors.length).toBeGreaterThan(0);
    expect(r.suggestedColors[0].ratio).toBeGreaterThanOrEqual(4.5);
    expect(r.suggestedColors[0].hue).toBeNull();
    expect(r.suggestedColors[0].saturation).toBe(0);
  });

  it('gray on black for AA (4.5:1)', () => {
    const r = executeFindAccessibleColor({ background: '#000000', targetRatio: 4.5 });
    expect(r.suggestedColors.length).toBeGreaterThan(0);
    expect(r.suggestedColors[0].ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('blue (hue=210) on white for AA', () => {
    const r = executeFindAccessibleColor({ background: '#FFFFFF', targetRatio: 4.5, hue: 210 });
    expect(r.suggestedColors.length).toBeGreaterThan(0);
    for (const s of r.suggestedColors) {
      expect(s.ratio).toBeGreaterThanOrEqual(4.5);
      expect(s.hue).toBe(210);
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('red (hue=0) on white for AAA (7:1)', () => {
    const r = executeFindAccessibleColor({ background: '#FFFFFF', targetRatio: 7, hue: 0 });
    expect(r.suggestedColors.length).toBeGreaterThan(0);
    for (const s of r.suggestedColors) {
      expect(s.ratio).toBeGreaterThanOrEqual(7);
    }
  });

  it('returns ≤ 4 suggestions', () => {
    const r = executeFindAccessibleColor({ background: '#FFFFFF', targetRatio: 3, hue: 180 });
    expect(r.suggestedColors.length).toBeLessThanOrEqual(4);
  });

  it('background hex is returned in response', () => {
    const r = executeFindAccessibleColor({ background: '#FF0000', targetRatio: 4.5 });
    expect(r.background).toBe('#ff0000');
    expect(r.targetRatio).toBe(4.5);
  });

  it('each suggestion ratio is actually correct', () => {
    const r = executeFindAccessibleColor({ background: '#FFFFFF', targetRatio: 4.5, hue: 120 });
    for (const s of r.suggestedColors) {
      const suggestedRgb = parseColor(s.hex);
      const bgRgb = parseColor('#FFFFFF');
      const actualRatio = roundRatio(contrastRatio(suggestedRgb, bgRgb));
      expect(actualRatio).toBeGreaterThanOrEqual(4.5);
      expect(Math.abs(actualRatio - s.ratio)).toBeLessThanOrEqual(0.02);
    }
  });

  it('finds accessible colors on dark backgrounds', () => {
    const r = executeFindAccessibleColor({ background: '#1A1A1A', targetRatio: 4.5 });
    expect(r.suggestedColors.length).toBeGreaterThan(0);
    expect(r.suggestedColors[0].ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('hue suggestions include saturation > 0', () => {
    const r = executeFindAccessibleColor({ background: '#FFFFFF', targetRatio: 4.5, hue: 120 });
    for (const s of r.suggestedColors) {
      expect(s.saturation).toBeGreaterThan(0);
    }
  });

  it('no duplicate hex values in suggestions', () => {
    const r = executeFindAccessibleColor({ background: '#FFFFFF', targetRatio: 4.5, hue: 210 });
    const hexes = r.suggestedColors.map((s) => s.hex);
    expect(new Set(hexes).size).toBe(hexes.length);
  });
});
