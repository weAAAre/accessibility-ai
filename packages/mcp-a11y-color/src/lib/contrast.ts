/**
 * WCAG 2.2 contrast ratio calculations.
 * @see https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
 */

import type { ContrastResult, RGBColor } from '../types.js';
import { relativeLuminance } from './color-parser.js';

/**
 * Calculate WCAG 2.2 contrast ratio between two colors.
 * Returns a value between 1 and 21.
 */
export function contrastRatio(color1: RGBColor, color2: RGBColor): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Round contrast ratio to 2 decimal places (WCAG convention).
 */
export function roundRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100;
}

/**
 * Check a contrast ratio against all WCAG 2.2 thresholds.
 */
export function checkContrast(fg: RGBColor, bg: RGBColor): ContrastResult {
  const ratio = roundRatio(contrastRatio(fg, bg));
  return {
    ratio,
    level: {
      AA_normal: ratio >= 4.5,
      AA_large: ratio >= 3,
      AAA_normal: ratio >= 7,
      AAA_large: ratio >= 4.5,
      AA_ui: ratio >= 3,
    },
  };
}

/**
 * Determine if text is "large" per WCAG 2.2.
 * Large text: ≥ 18pt (24px) or ≥ 14pt (18.5px) bold.
 */
export function isLargeText(fontSizePx: number, isBold: boolean): boolean {
  if (isBold) {
    return fontSizePx >= 18.5; // 14pt
  }
  return fontSizePx >= 24; // 18pt
}

/**
 * Get the required contrast ratio for a given context.
 */
export function getRequiredRatio(level: 'AA' | 'AAA', context: 'normal' | 'large' | 'ui'): number {
  if (context === 'ui') return 3;
  if (level === 'AAA') {
    return context === 'large' ? 4.5 : 7;
  }
  return context === 'large' ? 3 : 4.5;
}

/**
 * Adjust a color's lightness to meet a target contrast ratio against a background.
 * Returns the adjusted RGB color or null if impossible.
 */
export function adjustForContrast(
  fg: RGBColor,
  bg: RGBColor,
  targetRatio: number,
  direction?: 'lighten' | 'darken',
): RGBColor | null {
  const bgLum = relativeLuminance(bg);

  // Determine whether to lighten or darken the foreground:
  // darken if the background is lighter than the foreground (e.g. gray text on white)
  // lighten if the background is darker than the foreground (e.g. light text on dark bg)
  let shouldDarken: boolean;
  if (direction) {
    shouldDarken = direction === 'darken';
  } else {
    const fgLum = relativeLuminance(fg);
    shouldDarken = bgLum > fgLum;
  }

  // Binary search for the right lightness
  let low = 0;
  let high = 255;
  let bestColor: RGBColor | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  // Preserve the hue by scaling RGB proportionally
  const maxChannel = Math.max(fg.r, fg.g, fg.b, 1);
  const rRatio = fg.r / maxChannel;
  const gRatio = fg.g / maxChannel;
  const bRatio = fg.b / maxChannel;

  for (let i = 0; i < 50; i++) {
    const mid = Math.round((low + high) / 2);

    const candidate: RGBColor = shouldDarken
      ? {
          r: Math.round(rRatio * (255 - mid)),
          g: Math.round(gRatio * (255 - mid)),
          b: Math.round(bRatio * (255 - mid)),
        }
      : {
          r: Math.min(255, Math.round(fg.r + (255 - fg.r) * (mid / 255))),
          g: Math.min(255, Math.round(fg.g + (255 - fg.g) * (mid / 255))),
          b: Math.min(255, Math.round(fg.b + (255 - fg.b) * (mid / 255))),
        };

    const ratio = contrastRatio(candidate, bg);
    const diff = Math.abs(ratio - targetRatio);

    if (diff < bestDiff && ratio >= targetRatio) {
      bestDiff = diff;
      bestColor = candidate;
    }

    if (ratio < targetRatio) {
      if (shouldDarken) {
        low = mid + 1;
      } else {
        // Need more contrast — depends on bg lightness
        if (bgLum > 0.179) {
          low = mid + 1; // darken text on light bg (go further)
        } else {
          low = mid + 1; // lighten text on dark bg
        }
      }
    } else {
      high = mid - 1;
    }
  }

  return bestColor;
}
