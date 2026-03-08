import { z } from 'zod';

import { hslToRgb, parseColor, rgbToHex } from '../lib/color-parser.js';
import { contrastRatio, roundRatio } from '../lib/contrast.js';
import type { RGBColor } from '../types.js';

export const findAccessibleColorSchema = z.object({
  background: z.string().describe('Background CSS color'),
  targetRatio: z
    .number()
    .min(1)
    .max(21)
    .optional()
    .default(4.5)
    .describe('Target WCAG 2.2 contrast ratio (default: 4.5 for AA normal text)'),
  hue: z
    .number()
    .min(0)
    .max(360)
    .optional()
    .describe('Desired hue angle (0–360). If omitted, returns a neutral gray.'),
});

export type FindAccessibleColorInput = z.input<typeof findAccessibleColorSchema>;

export const executeFindAccessibleColor = (input: FindAccessibleColorInput) => {
  const bg = parseColor(input.background);
  const targetRatio = input.targetRatio ?? 4.5;
  const results: { hex: string; ratio: number; hue: number | null; saturation: number }[] = [];

  if (input.hue === undefined) {
    const color = findGrayWithContrast(bg, targetRatio);
    if (color) {
      results.push({
        hex: rgbToHex(color),
        ratio: roundRatio(contrastRatio(color, bg)),
        hue: null,
        saturation: 0,
      });
    }
  } else {
    for (const saturation of [80, 60, 40, 100]) {
      const color = findColorWithContrast(bg, targetRatio, input.hue, saturation);
      if (color) {
        const ratio = roundRatio(contrastRatio(color, bg));
        // Avoid duplicates
        const hex = rgbToHex(color);
        if (!results.some((r) => r.hex === hex)) {
          results.push({ hex, ratio, hue: input.hue, saturation });
        }
      }
    }
  }

  return {
    background: rgbToHex(bg),
    targetRatio,
    suggestedColors: results.slice(0, 4),
    note:
      results.length === 0
        ? `Could not find a color with contrast ratio ≥ ${targetRatio} at the requested hue.`
        : undefined,
  };
};

const findGrayWithContrast = (bg: RGBColor, targetRatio: number): RGBColor | null => {
  // Binary search through gray values
  for (let i = 0; i <= 255; i++) {
    const candidate: RGBColor = { r: i, g: i, b: i };
    if (contrastRatio(candidate, bg) >= targetRatio) {
      return candidate;
    }
  }
  // Try from the other end
  for (let i = 255; i >= 0; i--) {
    const candidate: RGBColor = { r: i, g: i, b: i };
    if (contrastRatio(candidate, bg) >= targetRatio) {
      return candidate;
    }
  }
  return null;
};

const findColorWithContrast = (
  bg: RGBColor,
  targetRatio: number,
  hue: number,
  saturation: number,
): RGBColor | null => {
  // Search through lightness values
  let bestColor: RGBColor | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let l = 0; l <= 100; l++) {
    const candidate = hslToRgb({ h: hue, s: saturation, l });
    const ratio = contrastRatio(candidate, bg);

    if (ratio >= targetRatio) {
      const diff = ratio - targetRatio;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestColor = candidate;
      }
    }
  }

  return bestColor;
};
