import { describe, expect, it } from '@rstest/core';

import { apcaContrast } from '../src/lib/apca.js';
import { deltaE, simulateColorBlindness } from '../src/lib/color-blindness.js';
import { findNearestColorName } from '../src/lib/color-names.js';
import { alphaBlend, parseColor, relativeLuminance, rgbToHex } from '../src/lib/color-parser.js';
import { contrastRatio, roundRatio } from '../src/lib/contrast.js';
import { executeAnalyzeDesignTokens } from '../src/tools/analyze-design-tokens.js';
import { executeAnalyzePaletteContrast } from '../src/tools/analyze-palette-contrast.js';
import { executeApcaContrast } from '../src/tools/apca-contrast.js';
import { executeCheckContrast } from '../src/tools/check-contrast.js';
import { executeGetColorInfo } from '../src/tools/get-color-info.js';
import { executeSimulateColorBlindness } from '../src/tools/simulate-color-blindness.js';
import { COLOR_BLINDNESS_TYPES } from '../src/types.js';

describe('Real-world UI scenarios', () => {
  it('GitHub Dark theme: #c9d1d9 on #0d1117 passes AA normal', () => {
    const r = executeCheckContrast({ foreground: '#c9d1d9', background: '#0d1117' });
    expect(r.contrastRatio).toBeGreaterThanOrEqual(7);
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
  });

  it('Bootstrap primary button: white on #0d6efd passes AA large', () => {
    const r = executeCheckContrast({ foreground: '#FFFFFF', background: '#0d6efd' });
    expect(r.results.wcag2_AA_large.pass).toBe(true);
  });

  it('Material Design error: #b00020 on white passes AA normal', () => {
    const r = executeCheckContrast({ foreground: '#b00020', background: '#FFFFFF' });
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
  });

  it('Placeholder #999 on white fails AA normal', () => {
    const r = executeCheckContrast({ foreground: '#999999', background: '#FFFFFF' });
    expect(r.contrastRatio).toBeLessThan(4.5);
    expect(r.results.wcag2_AA_normal.pass).toBe(false);
  });

  it('Link color #0066CC on white passes AA normal', () => {
    const r = executeCheckContrast({ foreground: '#0066CC', background: '#FFFFFF' });
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
  });

  it('iOS System Blue #007AFF on white passes AA large', () => {
    const r = executeCheckContrast({ foreground: '#007AFF', background: '#FFFFFF' });
    expect(r.results.wcag2_AA_large.pass).toBe(true);
  });

  it('VS Code sidebar: #cccccc on #252526 passes AA normal', () => {
    const r = executeCheckContrast({ foreground: '#cccccc', background: '#252526' });
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
  });

  it('Tailwind gray-500 (#6b7280) on white passes AA normal (≈ 4.6:1)', () => {
    const r = executeCheckContrast({ foreground: '#6b7280', background: '#FFFFFF' });
    expect(r.contrastRatio).toBeGreaterThanOrEqual(4.5);
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
  });

  it('Red error #D32F2F on white passes AA normal', () => {
    const r = executeCheckContrast({ foreground: '#D32F2F', background: '#FFFFFF' });
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
  });

  it('Disabled text #A0A0A0 on white fails AA normal', () => {
    const r = executeCheckContrast({ foreground: '#A0A0A0', background: '#FFFFFF' });
    expect(r.results.wcag2_AA_normal.pass).toBe(false);
  });

  it('#959595 on white fails AA normal but passes UI (3:1)', () => {
    const r = executeCheckContrast({ foreground: '#959595', background: '#FFFFFF' });
    expect(r.results.wcag2_AA_normal.pass).toBe(false);
    expect(r.results.wcag2_AA_ui.pass).toBe(true);
  });

  it('Success green #2E7D32 on white passes AA normal', () => {
    const r = executeCheckContrast({ foreground: '#2E7D32', background: '#FFFFFF' });
    expect(r.results.wcag2_AA_normal.pass).toBe(true);
  });

  it('Warning orange #F57C00 on white fails AA normal', () => {
    const r = executeCheckContrast({ foreground: '#F57C00', background: '#FFFFFF' });
    expect(r.results.wcag2_AA_normal.pass).toBe(false);
  });
});

describe('CVD real-world palette scenarios', () => {
  it('traffic light colors under protanopia lose red-green distinction', () => {
    const r = executeSimulateColorBlindness({
      colors: ['#FF0000', '#FFFF00', '#00FF00'],
      type: 'protanopia',
    });
    const simColors = r.simulations.protanopia.colors;
    expect(simColors).toHaveLength(3);
    const pairs = r.simulations.protanopia.pairContrasts;
    expect(pairs).toBeDefined();
    const rgPair = pairs?.find((p) => p.pair === '#FF0000 / #00FF00');
    expect(rgPair).toBeDefined();
  });

  it('chart colors under deuteranopia', () => {
    const r = executeSimulateColorBlindness({
      colors: ['#E74C3C', '#2ECC71', '#3498DB', '#F39C12'],
      type: 'deuteranopia',
    });
    const simColors = r.simulations.deuteranopia.colors;
    expect(simColors).toHaveLength(4);
    expect(r.simulations.deuteranopia.pairContrasts).toHaveLength(6);
  });

  it('blue/orange palette maintains contrast under all CVD types', () => {
    const r = executeSimulateColorBlindness({
      colors: ['#0066CC', '#FF6600'],
      type: 'all',
    });
    for (const type of COLOR_BLINDNESS_TYPES) {
      const pair = r.simulations[type].pairContrasts?.[0];
      expect(pair).toBeDefined();
      expect(pair?.ratio).toBeGreaterThan(1);
    }
  });
});

describe('isLight classification', () => {
  const lightColors: [string, string][] = [
    ['white', '#FFFFFF'],
    ['yellow', '#FFFF00'],
    ['lime', '#00FF00'],
    ['coral', 'coral'],
    ['orange', 'orange'],
    ['silver', '#C0C0C0'],
    ['lightyellow', 'lightyellow'],
  ];

  const darkColors: [string, string][] = [
    ['black', '#000000'],
    ['darkblue', '#00008B'],
    ['maroon', '#800000'],
    ['navy', 'navy'],
    ['dark gray', '#333333'],
    ['darkgreen', '#006400'],
    ['indigo', 'indigo'],
  ];

  for (const [desc, color] of lightColors) {
    it(`${desc} is light`, () => {
      const r = executeGetColorInfo({ color });
      expect(r.isLight).toBe(true);
    });
  }

  for (const [desc, color] of darkColors) {
    it(`${desc} is dark`, () => {
      const r = executeGetColorInfo({ color });
      expect(r.isLight).toBe(false);
    });
  }
});

describe('Edge cases', () => {
  it('very similar colors: #808080 vs #818181 → contrast ≈ 1', () => {
    const a = parseColor('#808080');
    const b = parseColor('#818181');
    const ratio = contrastRatio(a, b);
    expect(ratio).toBeCloseTo(1, 1);
    expect(ratio).toBeGreaterThanOrEqual(1);
  });

  it('luminance bounds: black = 0, white = 1', () => {
    expect(relativeLuminance(parseColor('#000000'))).toBe(0);
    expect(relativeLuminance(parseColor('#FFFFFF'))).toBe(1);
  });

  it('roundRatio(4.545) = 4.55', () => {
    expect(roundRatio(4.545)).toBe(4.55);
  });

  it('parseColor consistency: same input → same output', () => {
    const a = parseColor('#336699');
    const b = parseColor('#336699');
    expect(a).toEqual(b);
  });

  it('rgbToHex → parseColor roundtrip', () => {
    const original = { r: 171, g: 205, b: 239 };
    const hex = rgbToHex(original);
    const parsed = parseColor(hex);
    expect(parsed).toEqual(original);
  });

  it('alphaBlend identity: alpha = 1 → original color', () => {
    const fg = parseColor('#FF6600');
    const bg = parseColor('#FFFFFF');
    const blended = alphaBlend({ ...fg, a: 1 }, bg);
    expect(blended).toEqual(fg);
  });

  it('CVD simulations always produce integer RGB values', () => {
    const testColor = { r: 173, g: 216, b: 230 };
    for (const type of COLOR_BLINDNESS_TYPES) {
      const result = simulateColorBlindness(testColor, type);
      expect(Number.isInteger(result.r)).toBe(true);
      expect(Number.isInteger(result.g)).toBe(true);
      expect(Number.isInteger(result.b)).toBe(true);
    }
  });
});

describe('Cross-cutting invariants', () => {
  it('APCA: black on white absolute Lc > 100', () => {
    const lc = apcaContrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(lc).toBeGreaterThan(100);
  });

  it('APCA ≠ WCAG2: red on white has high APCA but low WCAG2 ratio', () => {
    const r = executeApcaContrast({ textColor: '#FF0000', backgroundColor: '#FFFFFF' });
    expect(r.wcag2.ratio).toBeLessThan(5);
    expect(r.apca.lc).toBeGreaterThan(60);
  });

  it('deltaE: identical colors = 0', () => {
    const c = { r: 128, g: 64, b: 192 };
    expect(deltaE(c, c)).toBe(0);
  });

  it('deltaE: symmetric', () => {
    const a = { r: 255, g: 0, b: 0 };
    const b = { r: 0, g: 0, b: 255 };
    expect(deltaE(a, b)).toBeCloseTo(deltaE(b, a), 10);
  });

  it('deltaE: black vs white > 90', () => {
    expect(deltaE({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeGreaterThan(90);
  });

  it('deltaE: red vs green > 50', () => {
    expect(deltaE({ r: 255, g: 0, b: 0 }, { r: 0, g: 128, b: 0 })).toBeGreaterThan(50);
  });

  it('CVD: achromatopsia on gray preserves approximate value', () => {
    const gray = { r: 128, g: 128, b: 128 };
    const sim = simulateColorBlindness(gray, 'achromatopsia');
    expect(sim.r).toBe(sim.g);
    expect(sim.g).toBe(sim.b);
    expect(Math.abs(sim.r - 128)).toBeLessThan(5);
  });

  it('CVD: white stays white and black stays black', () => {
    const white = simulateColorBlindness({ r: 255, g: 255, b: 255 }, 'achromatopsia');
    expect(white.r).toBeGreaterThanOrEqual(253);
    expect(white.g).toBeGreaterThanOrEqual(253);
    expect(white.b).toBeGreaterThanOrEqual(253);

    const black = simulateColorBlindness({ r: 0, g: 0, b: 0 }, 'achromatopsia');
    expect(black.r).toBe(0);
    expect(black.g).toBe(0);
    expect(black.b).toBe(0);
  });

  it('findNearestColorName always returns at least 1 match', () => {
    const arbitrary = ['#123456', '#ABCDEF', '#000000', '#FFFFFF', '#FF00FF', 'rgb(42, 99, 173)'];
    for (const c of arbitrary) {
      const result = findNearestColorName(parseColor(c));
      expect(result.name.length).toBeGreaterThan(0);
    }
  });

  it('APCA accepts 3-digit hex', () => {
    const r = executeApcaContrast({ textColor: '#000', backgroundColor: '#FFF' });
    expect(r.apca.lc).toBeGreaterThan(100);
  });

  it('palette analysis with named colors', () => {
    const r = executeAnalyzePaletteContrast({
      colors: [
        { name: 'black', value: 'black' },
        { name: 'white', value: 'white' },
        { name: 'navy', value: 'navy' },
      ],
      level: 'AA',
    });
    expect(r.summary.totalPairs).toBe(6);
    expect(r.summary.passingPairs).toBeGreaterThan(0);
  });

  it('design tokens: large token set classifies correctly', () => {
    const tokens: Record<string, string> = {
      'text-primary': '#1a1a1a',
      'text-secondary': '#666666',
      'text-link': '#0066CC',
      'bg-default': '#FFFFFF',
      'bg-surface': '#F5F5F5',
      'bg-overlay': '#000000',
      'fg-muted': '#888888',
      'heading-main': '#111111',
      brand: '#FF6600',
      accent: '#3399FF',
    };
    const r = executeAnalyzeDesignTokens({ tokens });
    expect(r.tokens).toHaveLength(10);
    const textTokens = r.tokens.filter((t) => t.role === 'text');
    const bgTokens = r.tokens.filter((t) => t.role === 'background');
    expect(textTokens.length).toBeGreaterThan(0);
    expect(bgTokens.length).toBeGreaterThan(0);
  });
});
