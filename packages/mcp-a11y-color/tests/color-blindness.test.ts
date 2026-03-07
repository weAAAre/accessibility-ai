import { describe, expect, it } from '@rstest/core';
import { deltaE, simulateAllTypes, simulateColorBlindness } from '../src/lib/color-blindness.js';
import type { ColorBlindnessType, RGBColor } from '../src/types.js';
import { COLOR_BLINDNESS_TYPES } from '../src/types.js';

// ─── simulateColorBlindness ──────────────────────────────────────────────────

describe('simulateColorBlindness', () => {
  const red: RGBColor = { r: 255, g: 0, b: 0 };
  const green: RGBColor = { r: 0, g: 255, b: 0 };
  const blue: RGBColor = { r: 0, g: 0, b: 255 };
  const white: RGBColor = { r: 255, g: 255, b: 255 };
  const black: RGBColor = { r: 0, g: 0, b: 0 };

  it('returns valid RGB values (0–255) for all CVD types', () => {
    for (const type of COLOR_BLINDNESS_TYPES) {
      const result = simulateColorBlindness(red, type);
      expect(result.r).toBeGreaterThanOrEqual(0);
      expect(result.r).toBeLessThanOrEqual(255);
      expect(result.g).toBeGreaterThanOrEqual(0);
      expect(result.g).toBeLessThanOrEqual(255);
      expect(result.b).toBeGreaterThanOrEqual(0);
      expect(result.b).toBeLessThanOrEqual(255);
    }
  });

  it('achromatopsia produces grayscale output', () => {
    const result = simulateColorBlindness(red, 'achromatopsia');
    // All channels should be equal (or very close, due to rounding)
    expect(Math.abs(result.r - result.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(result.g - result.b)).toBeLessThanOrEqual(1);
  });

  it('black stays black for all types', () => {
    for (const type of COLOR_BLINDNESS_TYPES) {
      const result = simulateColorBlindness(black, type);
      expect(result.r).toBe(0);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    }
  });

  it('white stays white (or very close) for all types', () => {
    for (const type of COLOR_BLINDNESS_TYPES) {
      const result = simulateColorBlindness(white, type);
      expect(result.r).toBeGreaterThanOrEqual(253);
      expect(result.g).toBeGreaterThanOrEqual(253);
      expect(result.b).toBeGreaterThanOrEqual(253);
    }
  });

  it('protanopia shifts red toward yellow/brown', () => {
    const result = simulateColorBlindness(red, 'protanopia');
    // Under protanopia, pure red loses red perception — green should be > 0
    expect(result.g).toBeGreaterThan(0);
    // Blue should remain low
    expect(result.b).toBeLessThan(30);
  });

  it('deuteranopia makes red and green more similar', () => {
    const simRed = simulateColorBlindness(red, 'deuteranopia');
    const simGreen = simulateColorBlindness(green, 'deuteranopia');
    // Under deuteranopia, red and green should be closer than under normal vision
    const normalDist = Math.sqrt(255 ** 2 + 255 ** 2); // max difference
    const simDist = Math.sqrt(
      (simRed.r - simGreen.r) ** 2 + (simRed.g - simGreen.g) ** 2 + (simRed.b - simGreen.b) ** 2,
    );
    expect(simDist).toBeLessThan(normalDist);
  });

  it('tritanopia primarily affects blue-yellow axis', () => {
    const result = simulateColorBlindness(blue, 'tritanopia');
    // Under tritanopia, pure blue shifts significantly
    // Blue channel should be reduced
    expect(result.b).toBeLessThan(200);
  });

  it('anomalous types produce less extreme shifts than corresponding dichromats', () => {
    // Protanomaly should shift less than protanopia
    const dichromat = simulateColorBlindness(red, 'protanopia');
    const anomalous = simulateColorBlindness(red, 'protanomaly');
    // Anomalous result should be closer to original red
    const dichDist = Math.abs(255 - dichromat.r) + Math.abs(dichromat.g) + Math.abs(dichromat.b);
    const anoDist = Math.abs(255 - anomalous.r) + Math.abs(anomalous.g) + Math.abs(anomalous.b);
    expect(anoDist).toBeLessThanOrEqual(dichDist);
  });
});

// ─── simulateAllTypes ────────────────────────────────────────────────────────

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
      const individual = simulateColorBlindness(color, type);
      expect(allResults[type]).toEqual(individual);
    }
  });
});

// ─── deltaE ──────────────────────────────────────────────────────────────────

describe('deltaE', () => {
  it('returns 0 for identical colors', () => {
    const color: RGBColor = { r: 128, g: 64, b: 200 };
    expect(deltaE(color, color)).toBe(0);
  });

  it('returns high value for black vs white', () => {
    const de = deltaE({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(de).toBeGreaterThan(90);
  });

  it('returns low value for similar colors', () => {
    const de = deltaE({ r: 100, g: 100, b: 100 }, { r: 102, g: 100, b: 101 });
    expect(de).toBeLessThan(5);
  });

  it('is commutative', () => {
    const a: RGBColor = { r: 255, g: 0, b: 0 };
    const b: RGBColor = { r: 0, g: 255, b: 0 };
    expect(deltaE(a, b)).toBeCloseTo(deltaE(b, a), 10);
  });

  it('red vs green has a large difference', () => {
    const de = deltaE({ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 });
    expect(de).toBeGreaterThan(50);
  });

  it('returns non-negative values', () => {
    const de = deltaE({ r: 50, g: 100, b: 150 }, { r: 200, g: 50, b: 80 });
    expect(de).toBeGreaterThan(0);
  });
});
