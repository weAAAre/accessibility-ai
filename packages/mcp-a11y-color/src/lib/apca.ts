/**
 * APCA (Accessible Perceptual Contrast Algorithm) — WCAG 3.0 draft.
 * @see https://github.com/Myndex/SAPC-APCA
 * @see https://www.w3.org/WAI/GL/task-forces/silver/wiki/Visual_Contrast_of_Text_Subgroup
 */

import type { RGBColor } from '../types.js';

// SAPC 0.0.98G-4g constants (apca-w3 0.1.9)
// @see https://github.com/Myndex/apca-w3/blob/master/src/apca-w3.js

const S_TRC = 2.4; // sRGB transfer curve exponent

const BLK_THRS = 0.022; // soft black clamp threshold
// biome-ignore lint/suspicious/noApproximativeNumericConstant: official APCA uses literal 1.414, not Math.SQRT2
const BLK_CLMP = 1.414; // soft black clamp exponent

const DELTA_Y_MIN = 0.0005; // below this delta, contrast is considered zero

// sRGB coefficients for luminance (Y)
const S_R_CO = 0.2126729;
const S_G_CO = 0.7151522;
const S_B_CO = 0.072175;

// Normal polarity exponents (dark text on light bg — BoW)
const NORM_TXT = 0.57;
const NORM_BG = 0.56;

// Reverse polarity exponents (light text on dark bg — WoB)
const REV_TXT = 0.62;
const REV_BG = 0.65;

// Scalers
const SCALE_BOW = 1.14;
const SCALE_WOB = 1.14;
const LO_BOW_OFFSET = 0.027;
const LO_WOB_OFFSET = 0.027;
const LO_CLIP = 0.1;

const sRGBtoY = (color: RGBColor): number => {
  const simpleExp = (c: number): number => (c / 255) ** S_TRC;
  let y = S_R_CO * simpleExp(color.r) + S_G_CO * simpleExp(color.g) + S_B_CO * simpleExp(color.b);
  if (y < 0) y = 0;
  return y;
};

const softClamp = (y: number): number => {
  if (y >= BLK_THRS) return y;
  return y + (BLK_THRS - y) ** BLK_CLMP;
};

export const apcaContrast = (textColor: RGBColor, bgColor: RGBColor): number => {
  let yText = sRGBtoY(textColor);
  let yBg = sRGBtoY(bgColor);

  if (Math.abs(yText - yBg) < DELTA_Y_MIN) return 0;

  yText = softClamp(yText);
  yBg = softClamp(yBg);

  // Normal polarity: dark text on light bg
  if (yBg > yText) {
    const sAPC = (yBg ** NORM_BG - yText ** NORM_TXT) * SCALE_BOW;
    return sAPC < LO_CLIP ? 0 : (sAPC - LO_BOW_OFFSET) * 100;
  }

  // Reverse polarity: light text on dark bg
  const sAPC = (yBg ** REV_BG - yText ** REV_TXT) * SCALE_WOB;
  return sAPC > -LO_CLIP ? 0 : (sAPC + LO_WOB_OFFSET) * 100;
};

export const roundLc = (lc: number): number => Math.round(lc * 10) / 10;

/** APCA font-size/weight recommendation thresholds (|Lc| values) */
export type ApcaFontRecommendation = {
  minLc: number;
  usage: string;
};

const APCA_THRESHOLDS: ApcaFontRecommendation[] = [
  { minLc: 90, usage: 'Preferred for body text (all weights)' },
  { minLc: 75, usage: 'Minimum for body text; preferred for large text' },
  { minLc: 60, usage: 'Body text (large/bold); sub-fluent text; UI components' },
  { minLc: 45, usage: 'Large bold text; UI component outlines; focus indicators' },
  { minLc: 30, usage: 'Non-text very large elements; decorative / spot color only' },
  { minLc: 15, usage: 'Barely visible; not usable for meaningful content' },
];

export const getApcaRecommendation = (lc: number): string => {
  const absLc = Math.abs(lc);
  for (const t of APCA_THRESHOLDS) {
    if (absLc >= t.minLc) return t.usage;
  }
  return 'Not readable — contrast too low for any content';
};
