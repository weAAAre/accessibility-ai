import { describe, expect, it } from '@rstest/core';

import { executeGetColorInfo } from '../../src/tools/get-color-info.js';

describe('executeGetColorInfo', () => {
  it('pure red (#FF0000)', () => {
    const r = executeGetColorInfo({ color: '#FF0000' });
    expect(r.hex).toBe('#ff0000');
    expect(r.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(r.hsl).toEqual({ h: 0, s: 100, l: 50 });
    expect(r.relativeLuminance).toBe(0.2126);
    expect(r.isLight).toBe(false);
    expect(r.contrastOnWhite).toBeCloseTo(4.0, 0);
    expect(r.contrastOnBlack).toBeCloseTo(5.25, 1);
  });

  it('pure green (#00FF00)', () => {
    const r = executeGetColorInfo({ color: '#00FF00' });
    expect(r.hex).toBe('#00ff00');
    expect(r.rgb).toEqual({ r: 0, g: 255, b: 0 });
    expect(r.hsl).toEqual({ h: 120, s: 100, l: 50 });
    expect(r.relativeLuminance).toBe(0.7152);
    expect(r.isLight).toBe(true);
    expect(r.contrastOnWhite).toBeCloseTo(1.37, 1);
    expect(r.contrastOnBlack).toBe(15.3);
  });

  it('pure blue (#0000FF)', () => {
    const r = executeGetColorInfo({ color: '#0000FF' });
    expect(r.hex).toBe('#0000ff');
    expect(r.rgb).toEqual({ r: 0, g: 0, b: 255 });
    expect(r.hsl).toEqual({ h: 240, s: 100, l: 50 });
    expect(r.relativeLuminance).toBe(0.0722);
    expect(r.isLight).toBe(false);
    expect(r.contrastOnWhite).toBe(8.59);
    expect(r.contrastOnBlack).toBeCloseTo(2.44, 1);
  });

  it('black (#000000)', () => {
    const r = executeGetColorInfo({ color: '#000000' });
    expect(r.hex).toBe('#000000');
    expect(r.relativeLuminance).toBe(0);
    expect(r.isLight).toBe(false);
    expect(r.contrastOnWhite).toBe(21);
    expect(r.contrastOnBlack).toBe(1);
  });

  it('white (#FFFFFF)', () => {
    const r = executeGetColorInfo({ color: '#FFFFFF' });
    expect(r.hex).toBe('#ffffff');
    expect(r.relativeLuminance).toBe(1);
    expect(r.isLight).toBe(true);
    expect(r.contrastOnWhite).toBe(1);
    expect(r.contrastOnBlack).toBe(21);
  });

  it('mid gray (#808080)', () => {
    const r = executeGetColorInfo({ color: '#808080' });
    expect(r.hex).toBe('#808080');
    expect(r.rgb).toEqual({ r: 128, g: 128, b: 128 });
    expect(r.hsl).toEqual({ h: 0, s: 0, l: 50 });
    expect(r.relativeLuminance).toBeCloseTo(0.2159, 3);
    expect(r.isLight).toBe(true);
    expect(r.contrastOnWhite).toBeCloseTo(3.95, 1);
    expect(r.contrastOnBlack).toBeCloseTo(5.32, 1);
  });

  it('orange (named color)', () => {
    const r = executeGetColorInfo({ color: 'orange' });
    expect(r.hex).toBe('#ffa500');
    expect(r.rgb).toEqual({ r: 255, g: 165, b: 0 });
    expect(r.isLight).toBe(true);
  });

  it('coral (named color)', () => {
    const r = executeGetColorInfo({ color: 'coral' });
    expect(r.hex).toBe('#ff7f50');
    expect(r.rgb).toEqual({ r: 255, g: 127, b: 80 });
    expect(r.isLight).toBe(true);
    expect(r.relativeLuminance).toBeCloseTo(0.3702, 3);
  });

  it('rebeccapurple (named color)', () => {
    const r = executeGetColorInfo({ color: 'rebeccapurple' });
    expect(r.hex).toBe('#663399');
    expect(r.rgb).toEqual({ r: 102, g: 51, b: 153 });
    expect(r.hsl).toEqual({ h: 270, s: 50, l: 40 });
    expect(r.isLight).toBe(false);
    expect(r.relativeLuminance).toBeCloseTo(0.0749, 3);
  });

  it('accepts rgb() notation', () => {
    const r = executeGetColorInfo({ color: 'rgb(255, 165, 0)' });
    expect(r.hex).toBe('#ffa500');
    expect(r.rgb).toEqual({ r: 255, g: 165, b: 0 });
  });

  it('accepts hsl() notation', () => {
    const r = executeGetColorInfo({ color: 'hsl(120, 100%, 50%)' });
    expect(r.hex).toBe('#00ff00');
    expect(r.rgb).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('contrastOnWhite × contrastOnBlack ≈ 21 for mid-luminance colors', () => {
    const r = executeGetColorInfo({ color: '#808080' });
    const product = r.contrastOnWhite * r.contrastOnBlack;
    expect(product).toBeCloseTo(21, 0);
  });

  it('contrastOnWhite and contrastOnBlack are always ≥ 1', () => {
    const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#808080', 'coral', 'navy'];
    for (const c of colors) {
      const r = executeGetColorInfo({ color: c });
      expect(r.contrastOnWhite).toBeGreaterThanOrEqual(1);
      expect(r.contrastOnBlack).toBeGreaterThanOrEqual(1);
    }
  });
});
