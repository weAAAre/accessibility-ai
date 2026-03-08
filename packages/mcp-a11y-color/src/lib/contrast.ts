/**
 * @see https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
 */

import type { ContrastResult, RGBColor } from '../types.js';

import { relativeLuminance } from './color-parser.js';

export const contrastRatio = (color1: RGBColor, color2: RGBColor): number => {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

export const roundRatio = (ratio: number): number => Math.round(ratio * 100) / 100;

export const checkContrast = (fg: RGBColor, bg: RGBColor): ContrastResult => {
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
};

export const isLargeText = (fontSizePx: number, isBold: boolean): boolean => {
  if (isBold) return fontSizePx >= 18.5;
  return fontSizePx >= 24;
};

export const getRequiredRatio = (
  level: 'AA' | 'AAA',
  context: 'normal' | 'large' | 'ui',
): number => {
  if (context === 'ui') return 3;
  if (level === 'AAA') return context === 'large' ? 4.5 : 7;
  return context === 'large' ? 3 : 4.5;
};

export const adjustForContrast = (
  fg: RGBColor,
  bg: RGBColor,
  targetRatio: number,
  direction?: 'lighten' | 'darken',
): RGBColor | null => {
  const bgLum = relativeLuminance(bg);

  let shouldDarken: boolean;
  if (direction) {
    shouldDarken = direction === 'darken';
  } else {
    const fgLum = relativeLuminance(fg);
    shouldDarken = bgLum > fgLum;
  }

  let low = 0;
  let high = 255;
  let bestColor: RGBColor | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

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
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestColor;
};
