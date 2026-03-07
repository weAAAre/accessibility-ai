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

// ─── parseColor ──────────────────────────────────────────────────────────────

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 3-digit shorthand hex', () => {
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses rgb() notation', () => {
    expect(parseColor('rgb(128, 64, 32)')).toEqual({ r: 128, g: 64, b: 32 });
  });

  it('parses named colors', () => {
    expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('white')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('black')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor('navy')).toEqual({ r: 0, g: 0, b: 128 });
  });

  it('parses hsl() notation', () => {
    const result = parseColor('hsl(0, 100%, 50%)');
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it('handles case-insensitive input', () => {
    expect(parseColor('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('RED')).toEqual({ r: 255, g: 0, b: 0 });
  });
});

// ─── parseColorWithAlpha ─────────────────────────────────────────────────────

describe('parseColorWithAlpha', () => {
  it('returns alpha = 1 for opaque colors', () => {
    const result = parseColorWithAlpha('#ff0000');
    expect(result.a).toBe(1);
    expect(result.r).toBe(255);
  });

  it('parses rgba() with alpha', () => {
    const result = parseColorWithAlpha('rgba(255, 0, 0, 0.5)');
    expect(result.r).toBe(255);
    expect(result.a).toBe(0.5);
  });
});

// ─── rgbToHex ────────────────────────────────────────────────────────────────

describe('rgbToHex', () => {
  it('converts pure red', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('converts black', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  it('converts mid-gray', () => {
    expect(rgbToHex({ r: 128, g: 128, b: 128 })).toBe('#808080');
  });
});

// ─── rgbToHsl ────────────────────────────────────────────────────────────────

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
    const hsl = rgbToHsl({ r: 0, g: 0, b: 0 });
    expect(hsl.l).toBe(0);
  });

  it('converts green to h≈120', () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 });
    expect(hsl.h).toBe(120);
  });

  it('converts blue to h≈240', () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 255 });
    expect(hsl.h).toBe(240);
  });
});

// ─── hslToRgb ────────────────────────────────────────────────────────────────

describe('hslToRgb', () => {
  it('converts pure red (h=0, s=100, l=50)', () => {
    const rgb = hslToRgb({ h: 0, s: 100, l: 50 });
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it('converts achromatic gray (s=0, l=50)', () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 50 });
    // gray — all channels should be approximately equal
    expect(rgb.r).toBeCloseTo(128, -1);
    expect(rgb.g).toBeCloseTo(128, -1);
    expect(rgb.b).toBeCloseTo(128, -1);
  });

  it('roundtrips with rgbToHsl for saturated colors', () => {
    const original = { r: 200, g: 50, b: 100 };
    const hsl = rgbToHsl(original);
    const backToRgb = hslToRgb(hsl);
    // Allow ±2 due to rounding
    expect(backToRgb.r).toBeCloseTo(original.r, -1);
    expect(backToRgb.g).toBeCloseTo(original.g, -1);
    expect(backToRgb.b).toBeCloseTo(original.b, -1);
  });
});

// ─── relativeLuminance ───────────────────────────────────────────────────────

describe('relativeLuminance', () => {
  it('returns 0 for black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it('returns 1 for white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4);
  });

  it('returns ≈0.2126 for pure red', () => {
    expect(relativeLuminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(0.2126, 3);
  });

  it('returns ≈0.7152 for pure green', () => {
    expect(relativeLuminance({ r: 0, g: 255, b: 0 })).toBeCloseTo(0.7152, 3);
  });

  it('returns ≈0.0722 for pure blue', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 255 })).toBeCloseTo(0.0722, 3);
  });

  it('luminance increases monotonically with gray level', () => {
    const l50 = relativeLuminance({ r: 50, g: 50, b: 50 });
    const l100 = relativeLuminance({ r: 100, g: 100, b: 100 });
    const l200 = relativeLuminance({ r: 200, g: 200, b: 200 });
    expect(l50).toBeLessThan(l100);
    expect(l100).toBeLessThan(l200);
  });
});

// ─── getColorInfo ────────────────────────────────────────────────────────────

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

// ─── alphaBlend ──────────────────────────────────────────────────────────────

describe('alphaBlend', () => {
  it('fully opaque foreground returns foreground', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 255 });
    expect(result).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('fully transparent foreground returns background', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 255 });
    expect(result).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('50% alpha blends equally', () => {
    const result = alphaBlend({ r: 255, g: 0, b: 0, a: 0.5 }, { r: 0, g: 0, b: 255 });
    expect(result.r).toBe(128);
    expect(result.b).toBe(128);
  });
});
