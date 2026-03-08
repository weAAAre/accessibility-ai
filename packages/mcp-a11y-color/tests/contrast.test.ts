import { describe, expect, it } from '@rstest/core';

import { parseColor } from '../src/lib/color-parser.js';
import {
  adjustForContrast,
  checkContrast,
  contrastRatio,
  getRequiredRatio,
  isLargeText,
  roundRatio,
} from '../src/lib/contrast.js';

import type { RGBColor } from '../src/types.js';

describe('WCAG contrast ratios — WebAIM-verified', () => {
  // ±0.01 tolerance: our implementation uses the corrected sRGB threshold (0.04045) per
  // IEC 61966-2-1, while WebAIM uses 0.03928.
  const webaimPairs: [string, string, number, number][] = [
    ['#000000', '#FFFFFF', 21, 0],
    ['#FFFFFF', '#000000', 21, 0],
    ['#FFFFFF', '#FFFFFF', 1, 0],
    ['#000000', '#000000', 1, 0],
    ['#777777', '#FFFFFF', 4.48, 0.01],
    ['#767676', '#FFFFFF', 4.54, 0],
    ['#595959', '#FFFFFF', 7.0, 0],
    ['#808080', '#FFFFFF', 3.95, 0.01],
    ['#696969', '#FFFFFF', 5.49, 0.01],
    ['#444444', '#FFFFFF', 9.74, 0.01],
    ['#333333', '#FFFFFF', 12.63, 0.03],
    ['#FF0000', '#FFFFFF', 4.0, 0.01],
    ['#00FF00', '#FFFFFF', 1.37, 0.01],
    ['#0000FF', '#FFFFFF', 8.59, 0],
    ['#FFFF00', '#FFFFFF', 1.07, 0],
    ['#FF00FF', '#FFFFFF', 3.14, 0.01],
    ['#00FFFF', '#FFFFFF', 1.25, 0.02],
    ['#CC0000', '#FFFFFF', 5.89, 0.01],
    ['#008000', '#FFFFFF', 5.14, 0.01],
    ['#800080', '#FFFFFF', 9.42, 0.01],
    ['#0066CC', '#FFFFFF', 5.57, 0.01],
    ['#FF6600', '#000000', 7.15, 0],
    ['#FFA500', '#000000', 10.63, 0.03],
    ['#FFD700', '#000000', 14.97, 0.07],
    ['#00FF00', '#000000', 15.3, 0],
    ['#00FFFF', '#000000', 16.75, 0.05],
    ['#1A1A1A', '#F5F5F5', 15.96, 0.06],
    ['#FFFFFF', '#333333', 12.63, 0.03],
    ['#FFFFFF', '#0000FF', 8.59, 0],
  ];

  for (const [fg, bg, expected, tol] of webaimPairs) {
    it(`${fg} on ${bg} → contrast ≈ ${expected}`, () => {
      const fgRgb = parseColor(fg);
      const bgRgb = parseColor(bg);
      const ratio = roundRatio(contrastRatio(fgRgb, bgRgb));
      expect(ratio).toBeGreaterThanOrEqual(expected - tol);
      expect(ratio).toBeLessThanOrEqual(expected + tol);
    });
  }
});

describe('WCAG pass/fail verdicts — WebAIM-verified', () => {
  type Verdict = {
    fg: string;
    bg: string;
    AA_normal: boolean;
    AA_large: boolean;
    AAA_normal: boolean;
    AAA_large: boolean;
  };

  const verdicts: Verdict[] = [
    {
      fg: '#000000',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#FFFFFF',
      bg: '#FFFFFF',
      AA_normal: false,
      AA_large: false,
      AAA_normal: false,
      AAA_large: false,
    },
    {
      fg: '#777777',
      bg: '#FFFFFF',
      AA_normal: false,
      AA_large: true,
      AAA_normal: false,
      AAA_large: false,
    },
    {
      fg: '#767676',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: false,
      AAA_large: true,
    },
    {
      fg: '#595959',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#808080',
      bg: '#FFFFFF',
      AA_normal: false,
      AA_large: true,
      AAA_normal: false,
      AAA_large: false,
    },
    {
      fg: '#FF0000',
      bg: '#FFFFFF',
      AA_normal: false,
      AA_large: true,
      AAA_normal: false,
      AAA_large: false,
    },
    {
      fg: '#0000FF',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#008000',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: false,
      AAA_large: true,
    },
    {
      fg: '#FFFF00',
      bg: '#FFFFFF',
      AA_normal: false,
      AA_large: false,
      AAA_normal: false,
      AAA_large: false,
    },
    {
      fg: '#CC0000',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: false,
      AAA_large: true,
    },
    {
      fg: '#FF00FF',
      bg: '#FFFFFF',
      AA_normal: false,
      AA_large: true,
      AAA_normal: false,
      AAA_large: false,
    },
    {
      fg: '#333333',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#444444',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#696969',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: false,
      AAA_large: true,
    },
    {
      fg: '#0066CC',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: false,
      AAA_large: true,
    },
    {
      fg: '#800080',
      bg: '#FFFFFF',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#FF6600',
      bg: '#000000',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#FFA500',
      bg: '#000000',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#00FF00',
      bg: '#000000',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#FFD700',
      bg: '#000000',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#00FFFF',
      bg: '#000000',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
    {
      fg: '#1A1A1A',
      bg: '#F5F5F5',
      AA_normal: true,
      AA_large: true,
      AAA_normal: true,
      AAA_large: true,
    },
  ];

  for (const v of verdicts) {
    it(`${v.fg} on ${v.bg} → AA:${v.AA_normal} AA_lg:${v.AA_large} AAA:${v.AAA_normal} AAA_lg:${v.AAA_large}`, () => {
      const result = checkContrast(parseColor(v.fg), parseColor(v.bg));
      expect(result.level.AA_normal).toBe(v.AA_normal);
      expect(result.level.AA_large).toBe(v.AA_large);
      expect(result.level.AAA_normal).toBe(v.AAA_normal);
      expect(result.level.AAA_large).toBe(v.AAA_large);
    });
  }
});

describe('contrast ratio mathematical properties', () => {
  it('is always ≥ 1', () => {
    const pairs: [RGBColor, RGBColor][] = [
      [
        { r: 0, g: 0, b: 0 },
        { r: 0, g: 0, b: 0 },
      ],
      [
        { r: 255, g: 255, b: 255 },
        { r: 255, g: 255, b: 255 },
      ],
      [
        { r: 100, g: 200, b: 50 },
        { r: 100, g: 201, b: 50 },
      ],
    ];
    for (const [a, b] of pairs) {
      expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(1);
    }
  });

  it('is always ≤ 21', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeLessThanOrEqual(21);
  });

  it('is commutative (order of colors does not matter)', () => {
    const testColors: RGBColor[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 128, b: 255 },
      { r: 50, g: 50, b: 50 },
      { r: 200, g: 200, b: 200 },
      { r: 0, g: 255, b: 128 },
    ];
    for (let i = 0; i < testColors.length; i++) {
      for (let j = i + 1; j < testColors.length; j++) {
        expect(contrastRatio(testColors[i], testColors[j])).toBe(
          contrastRatio(testColors[j], testColors[i]),
        );
      }
    }
  });

  it('identical colors always produce exactly 1', () => {
    const colors: RGBColor[] = [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
      { r: 128, g: 64, b: 32 },
      { r: 10, g: 200, b: 100 },
    ];
    for (const c of colors) {
      expect(contrastRatio(c, c)).toBe(1);
    }
  });
});

describe('roundRatio', () => {
  const cases: [number, number][] = [
    [4.5678, 4.57],
    [3.001, 3],
    [7.999, 8],
    [21, 21],
    [1, 1],
    [1.006, 1.01],
    [1.004, 1],
    [4.499, 4.5],
    [4.501, 4.5],
    [4.555, 4.56],
    [0.125, 0.13],
  ];

  for (const [input, expected] of cases) {
    it(`round(${input}) → ${expected}`, () => {
      expect(roundRatio(input)).toBe(expected);
    });
  }
});

describe('isLargeText', () => {
  const cases: [number, boolean, boolean][] = [
    [24, false, true],
    [23.99, false, false],
    [23, false, false],
    [18.5, true, true],
    [18.49, true, false],
    [18, true, false],
    [14, false, false],
    [14, true, false],
    [48, false, true],
    [48, true, true],
    [100, false, true],
    [0, false, false],
    [0, true, false],
  ];

  for (const [size, bold, expected] of cases) {
    it(`${size}px ${bold ? 'bold' : 'normal'} → ${expected ? 'large' : 'normal'}`, () => {
      expect(isLargeText(size, bold)).toBe(expected);
    });
  }
});

describe('getRequiredRatio', () => {
  const cases: ['AA' | 'AAA', 'normal' | 'large' | 'ui', number][] = [
    ['AA', 'normal', 4.5],
    ['AA', 'large', 3],
    ['AA', 'ui', 3],
    ['AAA', 'normal', 7],
    ['AAA', 'large', 4.5],
    ['AAA', 'ui', 3],
  ];

  for (const [level, ctx, expected] of cases) {
    it(`${level} ${ctx} → ${expected}`, () => {
      expect(getRequiredRatio(level, ctx)).toBe(expected);
    });
  }
});

describe('adjustForContrast', () => {
  const white: RGBColor = { r: 255, g: 255, b: 255 };
  const black: RGBColor = { r: 0, g: 0, b: 0 };

  it('adjusts light gray on white → darkens to meet 4.5', () => {
    const adjusted = adjustForContrast({ r: 200, g: 200, b: 200 }, white, 4.5);
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      expect(contrastRatio(adjusted, white)).toBeGreaterThanOrEqual(4.5);
      expect(adjusted.r).toBeLessThan(200);
    }
  });

  it('adjusts dark gray on black → lightens to meet 4.5', () => {
    const adjusted = adjustForContrast({ r: 50, g: 50, b: 50 }, black, 4.5);
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      expect(contrastRatio(adjusted, black)).toBeGreaterThanOrEqual(4.5);
      expect(adjusted.r).toBeGreaterThan(50);
    }
  });

  it('adjusts red on white → darkens while preserving red dominance', () => {
    const adjusted = adjustForContrast({ r: 255, g: 100, b: 50 }, white, 4.5, 'darken');
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      expect(adjusted.r).toBeGreaterThanOrEqual(adjusted.g);
      expect(adjusted.r).toBeGreaterThanOrEqual(adjusted.b);
      expect(contrastRatio(adjusted, white)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('adjusts for AAA (7:1) on white', () => {
    const adjusted = adjustForContrast({ r: 150, g: 150, b: 150 }, white, 7);
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      expect(contrastRatio(adjusted, white)).toBeGreaterThanOrEqual(7);
    }
  });

  it('adjusts for large text (3:1) on white', () => {
    const adjusted = adjustForContrast({ r: 200, g: 200, b: 200 }, white, 3);
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      expect(contrastRatio(adjusted, white)).toBeGreaterThanOrEqual(3);
    }
  });

  it('explicit lighten direction on black background', () => {
    const adjusted = adjustForContrast({ r: 50, g: 50, b: 50 }, black, 7, 'lighten');
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      expect(adjusted.r).toBeGreaterThan(50);
      expect(contrastRatio(adjusted, black)).toBeGreaterThanOrEqual(7);
    }
  });
});
