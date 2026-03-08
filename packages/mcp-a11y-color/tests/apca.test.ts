import { describe, expect, it } from '@rstest/core';

import { apcaContrast, getApcaRecommendation, roundLc } from '../src/lib/apca.js';

import type { RGBColor } from '../src/types.js';

describe('apcaContrast', () => {
  // Lc values computed from the SAPC 0.0.98G-4g algorithm, verified against https://github.com/Myndex/SAPC-APCA
  const lcPairs: [string, RGBColor, RGBColor, number][] = [
    ['black on white', { r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 106],
    ['white on black', { r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 }, -107.9],
    ['#333 on white', { r: 51, g: 51, b: 51 }, { r: 255, g: 255, b: 255 }, 98.7],
    ['#595959 on white', { r: 89, g: 89, b: 89 }, { r: 255, g: 255, b: 255 }, 84.3],
    ['#666 on white', { r: 102, g: 102, b: 102 }, { r: 255, g: 255, b: 255 }, 78.8],
    ['#777 on white', { r: 119, g: 119, b: 119 }, { r: 255, g: 255, b: 255 }, 71.1],
    ['#757575 on white', { r: 117, g: 117, b: 117 }, { r: 255, g: 255, b: 255 }, 72],
    ['#888 on white', { r: 136, g: 136, b: 136 }, { r: 255, g: 255, b: 255 }, 63.1],
    ['white on #888', { r: 255, g: 255, b: 255 }, { r: 136, g: 136, b: 136 }, -68.5],
    ['white on #595959', { r: 255, g: 255, b: 255 }, { r: 89, g: 89, b: 89 }, -89.2],
    ['red on white', { r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 64.1],
    ['blue on white', { r: 0, g: 0, b: 255 }, { r: 255, g: 255, b: 255 }, 85.8],
    ['green on white', { r: 0, g: 128, b: 0 }, { r: 255, g: 255, b: 255 }, 74.6],
    ['orange on white', { r: 255, g: 165, b: 0 }, { r: 255, g: 255, b: 255 }, 37.7],
    ['purple on white', { r: 128, g: 0, b: 128 }, { r: 255, g: 255, b: 255 }, 89.6],
    ['yellow on white (below loClip → 0)', { r: 255, g: 255, b: 0 }, { r: 255, g: 255, b: 255 }, 0],
    ['#1a1a1a on #f5f5f5', { r: 26, g: 26, b: 26 }, { r: 245, g: 245, b: 245 }, 98.3],
    ['navy on lightgray', { r: 0, g: 0, b: 128 }, { r: 211, g: 211, b: 211 }, 75.3],
  ];

  for (const [desc, text, bg, expectedLc] of lcPairs) {
    it(`${desc} → Lc ${expectedLc}`, () => {
      expect(roundLc(apcaContrast(text, bg))).toBe(expectedLc);
    });
  }

  it('identical colors return Lc = 0', () => {
    expect(apcaContrast({ r: 128, g: 128, b: 128 }, { r: 128, g: 128, b: 128 })).toBe(0);
  });

  it('near-identical dark colors return Lc = 0 (delta Y below threshold)', () => {
    expect(apcaContrast({ r: 1, g: 1, b: 1 }, { r: 2, g: 2, b: 2 })).toBe(0);
  });

  it('positive Lc for dark text on light background', () => {
    expect(apcaContrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeGreaterThan(0);
  });

  it('negative Lc for light text on dark background', () => {
    expect(apcaContrast({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 })).toBeLessThan(0);
  });

  it('polarity is nearly symmetric: |Lc(text,bg)| ≈ |Lc(bg,text)|', () => {
    const text = { r: 51, g: 51, b: 51 };
    const bg = { r: 245, g: 245, b: 245 };
    const normal = apcaContrast(text, bg);
    const reverse = apcaContrast(bg, text);
    expect(normal).toBeGreaterThan(0);
    expect(reverse).toBeLessThan(0);
    // APCA is intentionally asymmetric (normBG/revBG differ), so allow ≤ 5 Lc difference
    expect(Math.abs(Math.abs(normal) - Math.abs(reverse))).toBeLessThan(5);
  });

  it('maximum |Lc| is bounded by approximately 108 for any sRGB pair', () => {
    const maxLc = apcaContrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    const minLc = apcaContrast({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 });
    expect(maxLc).toBeLessThanOrEqual(110);
    expect(maxLc).toBeGreaterThanOrEqual(100);
    expect(minLc).toBeGreaterThanOrEqual(-110);
    expect(minLc).toBeLessThanOrEqual(-100);
  });

  it('lighter grays on white produce lower |Lc| (monotonic decrease)', () => {
    const white = { r: 255, g: 255, b: 255 };
    const lc333 = apcaContrast({ r: 51, g: 51, b: 51 }, white);
    const lc666 = apcaContrast({ r: 102, g: 102, b: 102 }, white);
    const lc999 = apcaContrast({ r: 153, g: 153, b: 153 }, white);
    const lcCCC = apcaContrast({ r: 204, g: 204, b: 204 }, white);
    expect(lc333).toBeGreaterThan(lc666);
    expect(lc666).toBeGreaterThan(lc999);
    expect(lc999).toBeGreaterThan(lcCCC);
  });
});

describe('roundLc', () => {
  it('rounds to 1 decimal place', () => {
    expect(roundLc(63.056469930209424)).toBe(63.1);
    expect(roundLc(-89.23263546037454)).toBe(-89.2);
    expect(roundLc(106.04067321268862)).toBe(106);
    expect(roundLc(0)).toBe(0);
  });
});

describe('getApcaRecommendation', () => {
  const thresholdTests: [number, string][] = [
    [116, 'Preferred for body text (all weights)'],
    [90, 'Preferred for body text (all weights)'],
    [89, 'Minimum for body text; preferred for large text'],
    [75, 'Minimum for body text; preferred for large text'],
    [74, 'Body text (large/bold); sub-fluent text; UI components'],
    [60, 'Body text (large/bold); sub-fluent text; UI components'],
    [59, 'Large bold text; UI component outlines; focus indicators'],
    [45, 'Large bold text; UI component outlines; focus indicators'],
    [44, 'Non-text very large elements; decorative / spot color only'],
    [30, 'Non-text very large elements; decorative / spot color only'],
    [29, 'Barely visible; not usable for meaningful content'],
    [15, 'Barely visible; not usable for meaningful content'],
    [14, 'Not readable — contrast too low for any content'],
    [0, 'Not readable — contrast too low for any content'],
  ];

  for (const [lc, expected] of thresholdTests) {
    it(`|Lc| = ${lc} → "${expected}"`, () => {
      expect(getApcaRecommendation(lc)).toBe(expected);
    });
  }

  it('works with negative Lc (uses absolute value)', () => {
    expect(getApcaRecommendation(-90)).toBe('Preferred for body text (all weights)');
    expect(getApcaRecommendation(-45)).toBe(
      'Large bold text; UI component outlines; focus indicators',
    );
  });
});

describe('APCA mathematical invariants', () => {
  const grays = [0, 32, 64, 96, 128, 160, 192, 224, 255];

  it('all grays on white produce positive Lc (except white itself)', () => {
    const white = { r: 255, g: 255, b: 255 };
    for (const v of grays.filter((v) => v < 240)) {
      const lc = apcaContrast({ r: v, g: v, b: v }, white);
      expect(lc).toBeGreaterThan(0);
    }
  });

  it('all grays on black produce negative Lc (bright enough grays)', () => {
    const black = { r: 0, g: 0, b: 0 };
    for (const v of grays.filter((v) => v >= 64)) {
      const lc = apcaContrast({ r: v, g: v, b: v }, black);
      expect(lc).toBeLessThan(0);
    }
  });

  it('contrast increases monotonically as text darkens on white bg', () => {
    const white = { r: 255, g: 255, b: 255 };
    let prevLc = 0;
    for (const v of [200, 170, 140, 110, 80, 50, 20, 0]) {
      const lc = apcaContrast({ r: v, g: v, b: v }, white);
      expect(lc).toBeGreaterThan(prevLc);
      prevLc = lc;
    }
  });

  it('blue contributes less luminance than green: blue Lc > green Lc on white', () => {
    const blueLc = apcaContrast({ r: 0, g: 0, b: 255 }, { r: 255, g: 255, b: 255 });
    const greenLc = apcaContrast({ r: 0, g: 255, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(blueLc).toBeGreaterThan(greenLc);
  });
});
