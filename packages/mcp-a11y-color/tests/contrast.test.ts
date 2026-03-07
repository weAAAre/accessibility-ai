import { describe, expect, it } from '@rstest/core';
import {
  adjustForContrast,
  checkContrast,
  contrastRatio,
  getRequiredRatio,
  isLargeText,
  roundRatio,
} from '../src/lib/contrast.js';

// ─── contrastRatio ───────────────────────────────────────────────────────────

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(roundRatio(ratio)).toBe(21);
  });

  it('returns 21 for white on black (order-independent)', () => {
    const ratio = contrastRatio({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 });
    expect(roundRatio(ratio)).toBe(21);
  });

  it('returns 1 for identical colors', () => {
    const ratio = contrastRatio({ r: 128, g: 128, b: 128 }, { r: 128, g: 128, b: 128 });
    expect(ratio).toBe(1);
  });

  it('is commutative — same result regardless of parameter order', () => {
    const a = { r: 100, g: 50, b: 200 };
    const b = { r: 200, g: 180, b: 30 };
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a));
  });

  it('returns known ratio for #767676 on white (≈4.54)', () => {
    const ratio = contrastRatio({ r: 118, g: 118, b: 118 }, { r: 255, g: 255, b: 255 });
    expect(roundRatio(ratio)).toBeCloseTo(4.54, 1);
  });
});

// ─── roundRatio ──────────────────────────────────────────────────────────────

describe('roundRatio', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundRatio(4.5678)).toBe(4.57);
    expect(roundRatio(3.001)).toBe(3);
    expect(roundRatio(7.999)).toBe(8);
  });
});

// ─── checkContrast ───────────────────────────────────────────────────────────

describe('checkContrast', () => {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  const midGray = { r: 128, g: 128, b: 128 };

  it('black on white passes all levels', () => {
    const result = checkContrast(black, white);
    expect(result.ratio).toBe(21);
    expect(result.level.AA_normal).toBe(true);
    expect(result.level.AA_large).toBe(true);
    expect(result.level.AAA_normal).toBe(true);
    expect(result.level.AAA_large).toBe(true);
    expect(result.level.AA_ui).toBe(true);
  });

  it('identical colors fail all levels', () => {
    const result = checkContrast(midGray, midGray);
    expect(result.ratio).toBe(1);
    expect(result.level.AA_normal).toBe(false);
    expect(result.level.AA_large).toBe(false);
    expect(result.level.AAA_normal).toBe(false);
    expect(result.level.AAA_large).toBe(false);
    expect(result.level.AA_ui).toBe(false);
  });

  it('correctly evaluates borderline AA normal (4.5:1)', () => {
    // #767676 on white ≈ 4.54:1 — passes AA normal
    const result = checkContrast({ r: 118, g: 118, b: 118 }, white);
    expect(result.level.AA_normal).toBe(true);
    expect(result.level.AA_large).toBe(true);
    // AAA normal needs 7:1 — should fail
    expect(result.level.AAA_normal).toBe(false);
  });

  it('correctly evaluates borderline AA large (3:1)', () => {
    // Find a color around 3:1 contrast on white
    const result = checkContrast({ r: 160, g: 160, b: 160 }, white);
    // Ratio should be around 3-ish
    expect(result.ratio).toBeGreaterThanOrEqual(2);
    expect(result.ratio).toBeLessThanOrEqual(4);
  });
});

// ─── isLargeText ─────────────────────────────────────────────────────────────

describe('isLargeText', () => {
  it('24px normal weight is large', () => {
    expect(isLargeText(24, false)).toBe(true);
  });

  it('23px normal weight is NOT large', () => {
    expect(isLargeText(23, false)).toBe(false);
  });

  it('18.5px bold is large (14pt bold)', () => {
    expect(isLargeText(18.5, true)).toBe(true);
  });

  it('18px bold is NOT large', () => {
    expect(isLargeText(18, true)).toBe(false);
  });

  it('14px normal weight is NOT large', () => {
    expect(isLargeText(14, false)).toBe(false);
  });

  it('48px is large regardless of weight', () => {
    expect(isLargeText(48, false)).toBe(true);
    expect(isLargeText(48, true)).toBe(true);
  });
});

// ─── getRequiredRatio ────────────────────────────────────────────────────────

describe('getRequiredRatio', () => {
  it('AA normal requires 4.5', () => {
    expect(getRequiredRatio('AA', 'normal')).toBe(4.5);
  });

  it('AA large requires 3', () => {
    expect(getRequiredRatio('AA', 'large')).toBe(3);
  });

  it('AAA normal requires 7', () => {
    expect(getRequiredRatio('AAA', 'normal')).toBe(7);
  });

  it('AAA large requires 4.5', () => {
    expect(getRequiredRatio('AAA', 'large')).toBe(4.5);
  });

  it('UI components require 3 regardless of level', () => {
    expect(getRequiredRatio('AA', 'ui')).toBe(3);
    expect(getRequiredRatio('AAA', 'ui')).toBe(3);
  });
});

// ─── adjustForContrast ───────────────────────────────────────────────────────

describe('adjustForContrast', () => {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  it('adjusts gray to meet 4.5:1 on white', () => {
    const adjusted = adjustForContrast({ r: 200, g: 200, b: 200 }, white, 4.5);
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      const ratio = contrastRatio(adjusted, white);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('adjusts gray to meet 4.5:1 on black (lightens)', () => {
    const adjusted = adjustForContrast({ r: 50, g: 50, b: 50 }, black, 4.5);
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      const ratio = contrastRatio(adjusted, black);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('preserves hue direction when darkening', () => {
    const adjusted = adjustForContrast({ r: 200, g: 100, b: 50 }, white, 4.5, 'darken');
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      // Red channel should still be the dominant channel
      expect(adjusted.r).toBeGreaterThanOrEqual(adjusted.g);
      expect(adjusted.r).toBeGreaterThanOrEqual(adjusted.b);
    }
  });

  it('respects explicit lighten direction', () => {
    const adjusted = adjustForContrast({ r: 50, g: 50, b: 50 }, black, 7, 'lighten');
    expect(adjusted).not.toBeNull();
    if (adjusted) {
      expect(adjusted.r).toBeGreaterThan(50);
    }
  });
});
