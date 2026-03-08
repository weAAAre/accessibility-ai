import { describe, expect, it } from '@rstest/core';

import { deltaE, simulateAllTypes, simulateColorBlindness } from '../src/lib/color-blindness.js';
import { rgbToHex } from '../src/lib/color-parser.js';

import type { ColorBlindnessType, RGBColor } from '../src/types.js';
import { COLOR_BLINDNESS_TYPES } from '../src/types.js';

describe('simulateColorBlindness — invariants', () => {
  it('black remains black under all 8 CVD types', () => {
    const black: RGBColor = { r: 0, g: 0, b: 0 };
    for (const type of COLOR_BLINDNESS_TYPES) {
      expect(simulateColorBlindness(black, type)).toEqual({ r: 0, g: 0, b: 0 });
    }
  });

  it('white remains white (±2) under all 8 CVD types', () => {
    const white: RGBColor = { r: 255, g: 255, b: 255 };
    for (const type of COLOR_BLINDNESS_TYPES) {
      const result = simulateColorBlindness(white, type);
      expect(result.r).toBeGreaterThanOrEqual(253);
      expect(result.g).toBeGreaterThanOrEqual(253);
      expect(result.b).toBeGreaterThanOrEqual(253);
    }
  });

  it('all outputs are clamped to 0–255', () => {
    const extremes: RGBColor[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 0, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
    ];
    for (const color of extremes) {
      for (const type of COLOR_BLINDNESS_TYPES) {
        const r = simulateColorBlindness(color, type);
        expect(r.r).toBeGreaterThanOrEqual(0);
        expect(r.r).toBeLessThanOrEqual(255);
        expect(r.g).toBeGreaterThanOrEqual(0);
        expect(r.g).toBeLessThanOrEqual(255);
        expect(r.b).toBeGreaterThanOrEqual(0);
        expect(r.b).toBeLessThanOrEqual(255);
      }
    }
  });

  it('outputs are integer RGB values', () => {
    for (const type of COLOR_BLINDNESS_TYPES) {
      const result = simulateColorBlindness({ r: 123, g: 45, b: 67 }, type);
      expect(Number.isInteger(result.r)).toBe(true);
      expect(Number.isInteger(result.g)).toBe(true);
      expect(Number.isInteger(result.b)).toBe(true);
    }
  });

  it('achromatopsia produces grayscale for any input', () => {
    const colors: RGBColor[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 200, g: 100, b: 50 },
      { r: 128, g: 64, b: 192 },
    ];
    for (const c of colors) {
      const r = simulateColorBlindness(c, 'achromatopsia');
      expect(Math.abs(r.r - r.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(r.g - r.b)).toBeLessThanOrEqual(1);
    }
  });

  it('anomalous trichromats shift LESS than corresponding dichromats', () => {
    const pairs: [ColorBlindnessType, ColorBlindnessType][] = [
      ['protanopia', 'protanomaly'],
      ['deuteranopia', 'deuteranomaly'],
      ['tritanopia', 'tritanomaly'],
      ['achromatopsia', 'achromatomaly'],
    ];
    const testColor: RGBColor = { r: 255, g: 0, b: 0 };
    for (const [dichromat, anomalous] of pairs) {
      const dich = simulateColorBlindness(testColor, dichromat);
      const anom = simulateColorBlindness(testColor, anomalous);
      const dichDist = Math.abs(255 - dich.r) + Math.abs(0 - dich.g) + Math.abs(0 - dich.b);
      const anomDist = Math.abs(255 - anom.r) + Math.abs(0 - anom.g) + Math.abs(0 - anom.b);
      expect(anomDist).toBeLessThanOrEqual(dichDist);
    }
  });
});

describe('simulateColorBlindness — behavioral', () => {
  it('protanopia shifts red toward yellow/brown', () => {
    const result = simulateColorBlindness({ r: 255, g: 0, b: 0 }, 'protanopia');
    expect(result.g).toBeGreaterThan(0);
    expect(result.b).toBeLessThan(30);
  });

  it('deuteranopia makes red and green more similar', () => {
    const red: RGBColor = { r: 255, g: 0, b: 0 };
    const green: RGBColor = { r: 0, g: 255, b: 0 };
    const simRed = simulateColorBlindness(red, 'deuteranopia');
    const simGreen = simulateColorBlindness(green, 'deuteranopia');
    const normalDist = Math.sqrt(255 ** 2 + 255 ** 2);
    const simDist = Math.sqrt(
      (simRed.r - simGreen.r) ** 2 + (simRed.g - simGreen.g) ** 2 + (simRed.b - simGreen.b) ** 2,
    );
    expect(simDist).toBeLessThan(normalDist);
  });

  it('tritanopia primarily affects blue-yellow axis', () => {
    const result = simulateColorBlindness({ r: 0, g: 0, b: 255 }, 'tritanopia');
    expect(result.b).toBeLessThan(200);
  });
});

describe('color blindness known outputs — pure red #FF0000', () => {
  const red: RGBColor = { r: 255, g: 0, b: 0 };

  it('protanopia → #c6c500', () => {
    expect(rgbToHex(simulateColorBlindness(red, 'protanopia'))).toBe('#c6c500');
  });

  it('protanomaly → #e99c00', () => {
    expect(rgbToHex(simulateColorBlindness(red, 'protanomaly'))).toBe('#e99c00');
  });

  it('deuteranopia → #cfda00', () => {
    expect(rgbToHex(simulateColorBlindness(red, 'deuteranopia'))).toBe('#cfda00');
  });

  it('deuteranomaly → #e78b00', () => {
    expect(rgbToHex(simulateColorBlindness(red, 'deuteranomaly'))).toBe('#e78b00');
  });

  it('tritanopia → #f90000', () => {
    expect(rgbToHex(simulateColorBlindness(red, 'tritanopia'))).toBe('#f90000');
  });

  it('tritanomaly → #fb0000', () => {
    expect(rgbToHex(simulateColorBlindness(red, 'tritanomaly'))).toBe('#fb0000');
  });

  it('achromatopsia → #959595', () => {
    expect(rgbToHex(simulateColorBlindness(red, 'achromatopsia'))).toBe('#959595');
  });

  it('achromatomaly → #ce7070', () => {
    expect(rgbToHex(simulateColorBlindness(red, 'achromatomaly'))).toBe('#ce7070');
  });
});

describe('simulateAllTypes', () => {
  it('returns all 8 CVD types', () => {
    const results = simulateAllTypes({ r: 200, g: 100, b: 50 });
    expect(Object.keys(results)).toHaveLength(8);
    for (const type of COLOR_BLINDNESS_TYPES) {
      expect(results[type]).toBeDefined();
      expect(results[type].r).toBeGreaterThanOrEqual(0);
      expect(results[type].r).toBeLessThanOrEqual(255);
    }
  });

  it('produces consistent results with individual calls', () => {
    const color: RGBColor = { r: 150, g: 75, b: 200 };
    const allResults = simulateAllTypes(color);
    for (const type of COLOR_BLINDNESS_TYPES) {
      expect(allResults[type]).toEqual(simulateColorBlindness(color, type));
    }
  });
});

describe('deltaE', () => {
  it('identical colors → 0', () => {
    expect(deltaE({ r: 128, g: 64, b: 200 }, { r: 128, g: 64, b: 200 })).toBe(0);
  });

  it('black vs white → very high (> 90)', () => {
    expect(deltaE({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeGreaterThan(90);
  });

  it('similar grays → low (< 5)', () => {
    expect(deltaE({ r: 100, g: 100, b: 100 }, { r: 102, g: 100, b: 101 })).toBeLessThan(5);
  });

  it('red vs green → large difference (> 50)', () => {
    expect(deltaE({ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 })).toBeGreaterThan(50);
  });

  it('is commutative', () => {
    const a: RGBColor = { r: 255, g: 0, b: 0 };
    const b: RGBColor = { r: 0, g: 255, b: 0 };
    expect(deltaE(a, b)).toBeCloseTo(deltaE(b, a), 10);
  });

  it('is non-negative', () => {
    const pairs: [RGBColor, RGBColor][] = [
      [
        { r: 50, g: 100, b: 150 },
        { r: 200, g: 50, b: 80 },
      ],
      [
        { r: 0, g: 0, b: 0 },
        { r: 0, g: 0, b: 1 },
      ],
      [
        { r: 255, g: 255, b: 255 },
        { r: 254, g: 254, b: 254 },
      ],
    ];
    for (const [a, b] of pairs) {
      expect(deltaE(a, b)).toBeGreaterThanOrEqual(0);
    }
  });

  it('triangle inequality holds (approximate)', () => {
    const a: RGBColor = { r: 255, g: 0, b: 0 };
    const b: RGBColor = { r: 0, g: 255, b: 0 };
    const c: RGBColor = { r: 0, g: 0, b: 255 };
    const dAB = deltaE(a, b);
    const dBC = deltaE(b, c);
    const dAC = deltaE(a, c);
    expect(dAC).toBeLessThanOrEqual(dAB + dBC + 0.01);
  });
});
