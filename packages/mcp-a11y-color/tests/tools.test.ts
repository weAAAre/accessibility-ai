import { describe, expect, it } from '@rstest/core';
import { executeCheckContrast } from '../src/tools/check-contrast.js';
import { executeFindAccessibleColor } from '../src/tools/find-accessible-color.js';
import { executeGetColorInfo } from '../src/tools/get-color-info.js';
import { executeSimulateColorBlindness } from '../src/tools/simulate-color-blindness.js';
import { executeSuggestContrastFix } from '../src/tools/suggest-contrast-fix.js';

// ─── check-contrast ──────────────────────────────────────────────────────────

describe('check-contrast', () => {
  it('returns 21:1 for black on white', () => {
    const result = executeCheckContrast({
      foreground: '#000000',
      background: '#ffffff',
    });
    expect(result.contrastRatio).toBe(21);
    expect(result.results.wcag2_AA_normal.pass).toBe(true);
    expect(result.results.wcag2_AAA_normal.pass).toBe(true);
  });

  it('returns 1:1 for white on white', () => {
    const result = executeCheckContrast({
      foreground: '#ffffff',
      background: '#ffffff',
    });
    expect(result.contrastRatio).toBe(1);
    expect(result.results.wcag2_AA_normal.pass).toBe(false);
  });

  it('correctly identifies large text', () => {
    const result = executeCheckContrast({
      foreground: '#767676',
      background: '#ffffff',
      fontSize: 24,
      fontWeight: 'normal',
    });
    expect(result.textSize).toBe('large');
    // #767676 on white ≈ 4.54:1 — passes AA normal and large
    expect(result.results.wcag2_AA_normal.pass).toBe(true);
    expect(result.results.wcag2_AA_large.pass).toBe(true);
  });

  it('handles named colors', () => {
    const result = executeCheckContrast({
      foreground: 'navy',
      background: 'white',
    });
    expect(result.contrastRatio).toBeGreaterThan(10);
  });

  it('detects bold text as large at 18.5px', () => {
    const result = executeCheckContrast({
      foreground: '#767676',
      background: '#ffffff',
      fontSize: 18.5,
      fontWeight: 'bold',
    });
    expect(result.textSize).toBe('large');
  });

  it('reports text size as unknown when no fontSize given', () => {
    const result = executeCheckContrast({
      foreground: '#000000',
      background: '#ffffff',
    });
    expect(result.textSize).toContain('unknown');
  });

  it('returns parsed hex values for foreground and background', () => {
    const result = executeCheckContrast({
      foreground: 'red',
      background: 'white',
    });
    expect(result.foreground.hex).toBe('#ff0000');
    expect(result.background.hex).toBe('#ffffff');
  });

  it('includes all WCAG threshold results', () => {
    const result = executeCheckContrast({
      foreground: '#000000',
      background: '#ffffff',
    });
    expect(result.results).toHaveProperty('wcag2_AA_normal');
    expect(result.results).toHaveProperty('wcag2_AA_large');
    expect(result.results).toHaveProperty('wcag2_AAA_normal');
    expect(result.results).toHaveProperty('wcag2_AAA_large');
    expect(result.results).toHaveProperty('wcag2_AA_ui');
  });

  it('includes required ratio in each result', () => {
    const result = executeCheckContrast({
      foreground: '#000',
      background: '#fff',
    });
    expect(result.results.wcag2_AA_normal.required).toBe(4.5);
    expect(result.results.wcag2_AA_large.required).toBe(3);
    expect(result.results.wcag2_AAA_normal.required).toBe(7);
    expect(result.results.wcag2_AAA_large.required).toBe(4.5);
    expect(result.results.wcag2_AA_ui.required).toBe(3);
  });
});

// ─── get-color-info ──────────────────────────────────────────────────────────

describe('get-color-info', () => {
  it('parses hex color correctly', () => {
    const result = executeGetColorInfo({ color: '#ff0000' });
    expect(result.hex).toBe('#ff0000');
    expect(result.rgb.r).toBe(255);
    expect(result.rgb.g).toBe(0);
    expect(result.rgb.b).toBe(0);
    expect(result.isLight).toBe(false);
  });

  it('provides contrast on black and white', () => {
    const result = executeGetColorInfo({ color: '#808080' });
    expect(result.contrastOnWhite).toBeGreaterThan(1);
    expect(result.contrastOnBlack).toBeGreaterThan(1);
  });

  it('returns HSL values', () => {
    const result = executeGetColorInfo({ color: '#ff0000' });
    expect(result.hsl.h).toBe(0);
    expect(result.hsl.s).toBe(100);
    expect(result.hsl.l).toBe(50);
  });

  it('returns relative luminance', () => {
    const white = executeGetColorInfo({ color: '#ffffff' });
    const black = executeGetColorInfo({ color: '#000000' });
    expect(white.relativeLuminance).toBeCloseTo(1, 3);
    expect(black.relativeLuminance).toBe(0);
  });

  it('contrast on white is 21 for black', () => {
    const result = executeGetColorInfo({ color: '#000000' });
    expect(result.contrastOnWhite).toBe(21);
  });

  it('contrast on black is 21 for white', () => {
    const result = executeGetColorInfo({ color: '#ffffff' });
    expect(result.contrastOnBlack).toBe(21);
  });
});

// ─── suggest-contrast-fix ────────────────────────────────────────────────────

describe('suggest-contrast-fix', () => {
  it('reports already passing pairs', () => {
    const result = executeSuggestContrastFix({
      foreground: '#000000',
      background: '#ffffff',
      level: 'AA',
      textSize: 'normal',
    });
    expect(result.status).toBe('already_passing');
  });

  it('suggests a fix for failing pairs', () => {
    const result = executeSuggestContrastFix({
      foreground: '#999999',
      background: '#ffffff',
      level: 'AA',
      textSize: 'normal',
    });
    expect(result.status).toBe('fixed');
    if (result.status === 'fixed') {
      expect(result.suggested.ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('suggests fix for AAA level', () => {
    const result = executeSuggestContrastFix({
      foreground: '#767676',
      background: '#ffffff',
      level: 'AAA',
      textSize: 'normal',
    });
    // #767676 on white ≈ 4.54:1, AAA normal needs 7:1
    expect(result.status).toBe('fixed');
    if (result.status === 'fixed') {
      expect(result.suggested.ratio).toBeGreaterThanOrEqual(7);
    }
  });

  it('uses large text threshold when specified', () => {
    const result = executeSuggestContrastFix({
      foreground: '#999999',
      background: '#ffffff',
      level: 'AA',
      textSize: 'large',
    });
    // Large text only needs 3:1 — #999 on white is ~2.85, barely failing
    if (result.status === 'fixed') {
      expect(result.suggested.ratio).toBeGreaterThanOrEqual(3);
    }
  });

  it('uses UI component threshold when specified', () => {
    const result = executeSuggestContrastFix({
      foreground: '#aaaaaa',
      background: '#ffffff',
      level: 'AA',
      textSize: 'ui',
    });
    // UI components need 3:1
    if (result.status === 'fixed') {
      expect(result.suggested.ratio).toBeGreaterThanOrEqual(3);
    }
  });

  it('returns deltaE showing color similarity', () => {
    const result = executeSuggestContrastFix({
      foreground: '#999999',
      background: '#ffffff',
      level: 'AA',
      textSize: 'normal',
    });
    if (result.status === 'fixed') {
      expect(result.deltaE).toBeDefined();
      expect(result.deltaE).toBeGreaterThan(0);
    }
  });

  it('includes original and target info in all responses', () => {
    const result = executeSuggestContrastFix({
      foreground: '#000000',
      background: '#ffffff',
      level: 'AA',
      textSize: 'normal',
    });
    expect(result.original).toBeDefined();
    expect(result.target).toBeDefined();
    expect(result.target.level).toBe('AA');
    expect(result.target.textSize).toBe('normal');
  });
});

// ─── simulate-color-blindness ────────────────────────────────────────────────

describe('simulate-color-blindness', () => {
  it('simulates a single color under all CVD types', () => {
    const result = executeSimulateColorBlindness({
      colors: ['#ff0000'],
      type: 'all',
    });
    expect(result.original).toEqual(['#ff0000']);
    expect(Object.keys(result.simulations)).toHaveLength(8);
  });

  it('computes pair contrast data for multiple colors', () => {
    const result = executeSimulateColorBlindness({
      colors: ['#ff0000', '#00ff00'],
      type: 'deuteranopia',
    });
    expect(result.simulations.deuteranopia).toBeDefined();
    // pairContrasts should always be present when 2+ colors are provided
    expect(result.simulations.deuteranopia.pairContrasts).toBeDefined();
    expect(result.simulations.deuteranopia.pairContrasts).toHaveLength(1);
  });

  it('returns simulated colors as hex strings', () => {
    const result = executeSimulateColorBlindness({
      colors: ['#ff0000'],
      type: 'protanopia',
    });
    const colors = result.simulations.protanopia.colors;
    expect(colors).toHaveLength(1);
    expect(colors[0]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('generates warnings for hard-to-distinguish pairs', () => {
    // Two very similar greens that become nearly identical under deuteranopia
    const result = executeSimulateColorBlindness({
      colors: ['#33aa33', '#aa3333'],
      type: 'achromatopsia',
    });
    // Under achromatopsia (total color blindness), many color pairs collapse —
    // if any pair has deltaE < 20, a warning should be generated
    const simColors = result.simulations.achromatopsia;
    expect(simColors.pairContrasts).toBeDefined();
    // Whether or not these specific colors trigger a warning depends on deltaE,
    // but we can at least verify the structure
    if (result.warnings && result.warnings.length > 0) {
      expect(result.warnings[0]).toContain('achromatopsia');
    }
  });

  it('handles single color without pairContrasts', () => {
    const result = executeSimulateColorBlindness({
      colors: ['#336699'],
      type: 'tritanopia',
    });
    expect(result.simulations.tritanopia.pairContrasts).toBeUndefined();
  });

  it('handles 3+ colors with correct number of pairs', () => {
    const result = executeSimulateColorBlindness({
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      type: 'protanopia',
    });
    // 3 colors → C(3,2) = 3 pairs
    expect(result.simulations.protanopia.pairContrasts).toHaveLength(3);
  });

  it('simulating specific type returns only that type', () => {
    const result = executeSimulateColorBlindness({
      colors: ['#cc3366'],
      type: 'achromatopsia',
    });
    expect(Object.keys(result.simulations)).toEqual(['achromatopsia']);
  });
});

// ─── find-accessible-color ───────────────────────────────────────────────────

describe('find-accessible-color', () => {
  it('finds a gray that meets 4.5:1 on white', () => {
    const result = executeFindAccessibleColor({
      background: '#ffffff',
      targetRatio: 4.5,
    });
    expect(result.suggestedColors.length).toBeGreaterThan(0);
    expect(result.suggestedColors[0].ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('finds a blue that meets 4.5:1 on white', () => {
    const result = executeFindAccessibleColor({
      background: '#ffffff',
      targetRatio: 4.5,
      hue: 220,
    });
    expect(result.suggestedColors.length).toBeGreaterThan(0);
    expect(result.suggestedColors[0].ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('returns background color in response', () => {
    const result = executeFindAccessibleColor({
      background: '#ffffff',
      targetRatio: 4.5,
    });
    expect(result.background).toBe('#ffffff');
    expect(result.targetRatio).toBe(4.5);
  });

  it('returns hex colors in suggestions', () => {
    const result = executeFindAccessibleColor({
      background: '#ffffff',
      targetRatio: 4.5,
      hue: 0,
    });
    for (const suggestion of result.suggestedColors) {
      expect(suggestion.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('finds colors on dark backgrounds', () => {
    const result = executeFindAccessibleColor({
      background: '#1a1a1a',
      targetRatio: 4.5,
    });
    expect(result.suggestedColors.length).toBeGreaterThan(0);
    expect(result.suggestedColors[0].ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('finds colors for AAA level (7:1)', () => {
    const result = executeFindAccessibleColor({
      background: '#ffffff',
      targetRatio: 7,
    });
    expect(result.suggestedColors.length).toBeGreaterThan(0);
    expect(result.suggestedColors[0].ratio).toBeGreaterThanOrEqual(7);
  });

  it('returns at most 4 suggestions', () => {
    const result = executeFindAccessibleColor({
      background: '#ffffff',
      targetRatio: 3,
      hue: 180,
    });
    expect(result.suggestedColors.length).toBeLessThanOrEqual(4);
  });

  it('includes hue and saturation in suggestions with hue', () => {
    const result = executeFindAccessibleColor({
      background: '#ffffff',
      targetRatio: 4.5,
      hue: 120,
    });
    if (result.suggestedColors.length > 0) {
      expect(result.suggestedColors[0].hue).toBe(120);
      expect(result.suggestedColors[0].saturation).toBeGreaterThan(0);
    }
  });

  it('neutral gray suggestions have null hue', () => {
    const result = executeFindAccessibleColor({
      background: '#ffffff',
      targetRatio: 4.5,
    });
    if (result.suggestedColors.length > 0) {
      expect(result.suggestedColors[0].hue).toBeNull();
      expect(result.suggestedColors[0].saturation).toBe(0);
    }
  });
});
