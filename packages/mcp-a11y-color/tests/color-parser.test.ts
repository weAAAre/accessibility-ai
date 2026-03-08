import { describe, expect, it } from '@rstest/core';

import {
  alphaBlend,
  getColorInfo,
  hslToRgb,
  parseColor,
  parseColorWithAlpha,
  relativeLuminance,
  rgbToHex,
  rgbToHsl,
} from '../src/lib/color-parser.js';

import type { RGBColor } from '../src/types.js';

describe('parseColor — format coverage', () => {
  const expected: [string, RGBColor][] = [
    ['#ff0000', { r: 255, g: 0, b: 0 }],
    ['#FF0000', { r: 255, g: 0, b: 0 }],
    ['#f00', { r: 255, g: 0, b: 0 }],
    ['#F00', { r: 255, g: 0, b: 0 }],
    ['red', { r: 255, g: 0, b: 0 }],
    ['RED', { r: 255, g: 0, b: 0 }],
    ['rgb(255, 0, 0)', { r: 255, g: 0, b: 0 }],
    ['rgb(255,0,0)', { r: 255, g: 0, b: 0 }],
    ['hsl(0, 100%, 50%)', { r: 255, g: 0, b: 0 }],
    ['white', { r: 255, g: 255, b: 255 }],
    ['black', { r: 0, g: 0, b: 0 }],
    ['navy', { r: 0, g: 0, b: 128 }],
    ['green', { r: 0, g: 128, b: 0 }],
    ['lime', { r: 0, g: 255, b: 0 }],
    ['blue', { r: 0, g: 0, b: 255 }],
    ['yellow', { r: 255, g: 255, b: 0 }],
    ['cyan', { r: 0, g: 255, b: 255 }],
    ['magenta', { r: 255, g: 0, b: 255 }],
    ['silver', { r: 192, g: 192, b: 192 }],
    ['gray', { r: 128, g: 128, b: 128 }],
    ['maroon', { r: 128, g: 0, b: 0 }],
    ['olive', { r: 128, g: 128, b: 0 }],
    ['teal', { r: 0, g: 128, b: 128 }],
    ['purple', { r: 128, g: 0, b: 128 }],
    ['orange', { r: 255, g: 165, b: 0 }],
    ['coral', { r: 255, g: 127, b: 80 }],
    ['rebeccapurple', { r: 102, g: 51, b: 153 }],
  ];

  for (const [input, exp] of expected) {
    it(`parseColor("${input}") → rgb(${exp.r},${exp.g},${exp.b})`, () => {
      expect(parseColor(input)).toEqual(exp);
    });
  }
});

describe('rgbToHex', () => {
  const hexCases: [RGBColor, string][] = [
    [{ r: 0, g: 0, b: 0 }, '#000000'],
    [{ r: 255, g: 255, b: 255 }, '#ffffff'],
    [{ r: 255, g: 0, b: 0 }, '#ff0000'],
    [{ r: 0, g: 255, b: 0 }, '#00ff00'],
    [{ r: 0, g: 0, b: 255 }, '#0000ff'],
    [{ r: 128, g: 128, b: 128 }, '#808080'],
    [{ r: 192, g: 192, b: 192 }, '#c0c0c0'],
    [{ r: 255, g: 165, b: 0 }, '#ffa500'],
    [{ r: 102, g: 51, b: 153 }, '#663399'],
    [{ r: 1, g: 2, b: 3 }, '#010203'],
    [{ r: 15, g: 15, b: 15 }, '#0f0f0f'],
    [{ r: 16, g: 16, b: 16 }, '#101010'],
  ];

  for (const [rgb, hex] of hexCases) {
    it(`rgb(${rgb.r},${rgb.g},${rgb.b}) → ${hex}`, () => {
      expect(rgbToHex(rgb)).toBe(hex);
    });
  }
});

describe('rgbToHsl', () => {
  it('converts pure red to h=0 s=100 l=50', () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it('converts white to l=100', () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
    expect(hsl.l).toBe(100);
    expect(hsl.s).toBe(0);
  });

  it('converts black to l=0', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 0 }).l).toBe(0);
  });

  it('converts green to h=120', () => {
    expect(rgbToHsl({ r: 0, g: 255, b: 0 }).h).toBe(120);
  });

  it('converts blue to h=240', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 255 }).h).toBe(240);
  });
});

describe('hslToRgb', () => {
  it('converts achromatic gray (s=0, l=50)', () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 50 });
    expect(rgb.r).toBeCloseTo(128, -1);
    expect(rgb.g).toBeCloseTo(128, -1);
    expect(rgb.b).toBeCloseTo(128, -1);
  });

  it('hsl(0,100,50) → red', () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('hsl(120,100,50) → lime', () => {
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('hsl(240,100,50) → blue', () => {
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('hsl(0,0,0) → black', () => {
    expect(hslToRgb({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('hsl(0,0,100) → white', () => {
    expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('HSL ↔ RGB round-trips', () => {
  const colors: RGBColor[] = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 0 },
    { r: 0, g: 255, b: 255 },
    { r: 255, g: 0, b: 255 },
    { r: 128, g: 128, b: 128 },
    { r: 200, g: 100, b: 50 },
    { r: 50, g: 150, b: 200 },
    { r: 10, g: 10, b: 10 },
    { r: 245, g: 245, b: 245 },
  ];

  for (const color of colors) {
    it(`roundtrip rgb(${color.r},${color.g},${color.b})`, () => {
      const hsl = rgbToHsl(color);
      const back = hslToRgb(hsl);
      expect(back.r).toBeCloseTo(color.r, -1);
      expect(back.g).toBeCloseTo(color.g, -1);
      expect(back.b).toBeCloseTo(color.b, -1);
    });
  }
});

describe('relativeLuminance', () => {
  // @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
  const cases: [string, RGBColor, number][] = [
    ['black', { r: 0, g: 0, b: 0 }, 0],
    ['white', { r: 255, g: 255, b: 255 }, 1],
    ['pure red', { r: 255, g: 0, b: 0 }, 0.2126],
    ['pure green', { r: 0, g: 255, b: 0 }, 0.7152],
    ['pure blue', { r: 0, g: 0, b: 255 }, 0.0722],
    ['mid gray (#808080)', { r: 128, g: 128, b: 128 }, 0.2159],
    ['yellow (#FFFF00)', { r: 255, g: 255, b: 0 }, 0.9278],
    ['cyan (#00FFFF)', { r: 0, g: 255, b: 255 }, 0.7874],
    ['magenta (#FF00FF)', { r: 255, g: 0, b: 255 }, 0.2848],
    ['dark gray (#333333)', { r: 51, g: 51, b: 51 }, 0.0331],
    ['navy (#000080)', { r: 0, g: 0, b: 128 }, 0.0154],
    ['#767676', { r: 118, g: 118, b: 118 }, 0.1812],
  ];

  for (const [name, color, expected] of cases) {
    it(`${name} → luminance ≈ ${expected}`, () => {
      expect(relativeLuminance(color)).toBeCloseTo(expected, 3);
    });
  }

  it('luminance is monotonically increasing for grays 0..255', () => {
    let prev = -1;
    for (let i = 0; i <= 255; i++) {
      const lum = relativeLuminance({ r: i, g: i, b: i });
      expect(lum).toBeGreaterThanOrEqual(prev);
      prev = lum;
    }
  });
});

describe('getColorInfo', () => {
  it('returns all fields for a hex color', () => {
    const info = getColorInfo('#ff0000');
    expect(info.hex).toBe('#ff0000');
    expect(info.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(info.hsl.h).toBe(0);
    expect(info.relativeLuminance).toBeCloseTo(0.2126, 3);
    expect(info.isLight).toBe(false);
  });

  it('detects light colors', () => {
    expect(getColorInfo('#ffffff').isLight).toBe(true);
    expect(getColorInfo('yellow').isLight).toBe(true);
  });

  it('detects dark colors', () => {
    expect(getColorInfo('#000000').isLight).toBe(false);
    expect(getColorInfo('navy').isLight).toBe(false);
  });
});

describe('alpha handling', () => {
  it('opaque hex returns alpha=1', () => {
    const r = parseColorWithAlpha('#ff0000');
    expect(r.a).toBe(1);
    expect(r.r).toBe(255);
  });

  it('rgba with 0.5 alpha', () => {
    const r = parseColorWithAlpha('rgba(255, 0, 0, 0.5)');
    expect(r.r).toBe(255);
    expect(r.g).toBe(0);
    expect(r.b).toBe(0);
    expect(r.a).toBe(0.5);
  });

  it('rgba with 0 alpha', () => {
    expect(parseColorWithAlpha('rgba(255, 0, 0, 0)').a).toBe(0);
  });

  it('alphaBlend: fully opaque → returns foreground', () => {
    expect(alphaBlend({ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 255 })).toEqual({
      r: 255,
      g: 0,
      b: 0,
    });
  });

  it('alphaBlend: fully transparent → returns background', () => {
    expect(alphaBlend({ r: 255, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 255 })).toEqual({
      r: 0,
      g: 0,
      b: 255,
    });
  });

  it('alphaBlend: 50% red on blue', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 0.5 }, { r: 0, g: 0, b: 255 });
    expect(result.r).toBe(128);
    expect(result.g).toBe(0);
    expect(result.b).toBe(128);
  });

  it('alphaBlend: 25% white on black', () => {
    const result = alphaBlend({ r: 255, g: 255, b: 255, a: 0.25 }, { r: 0, g: 0, b: 0 });
    expect(result.r).toBe(64);
    expect(result.g).toBe(64);
    expect(result.b).toBe(64);
  });

  it('alphaBlend: 75% green on white', () => {
    const result = alphaBlend({ r: 0, g: 255, b: 0, a: 0.75 }, { r: 255, g: 255, b: 255 });
    expect(result.r).toBe(64);
    expect(result.g).toBe(255);
    expect(result.b).toBe(64);
  });

  it('alphaBlend with alpha=1 is identity', () => {
    for (let i = 0; i < 256; i += 51) {
      const fg = { r: i, g: i, b: i, a: 1 };
      const bg: RGBColor = { r: 255 - i, g: 255 - i, b: 255 - i };
      const result = alphaBlend(fg, bg);
      expect(result).toEqual({ r: i, g: i, b: i });
    }
  });
});
