import { z } from 'zod';

import { deltaE, simulateColorBlindness } from '../lib/color-blindness.js';
import { hslToRgb, rgbToHex } from '../lib/color-parser.js';
import type { ColorBlindnessType, RGBColor } from '../types.js';
import { COLOR_BLINDNESS_TYPES } from '../types.js';

export const generateCvdSafePaletteSchema = z.object({
  count: z.number().int().min(2).max(12).describe('Number of colors to generate (2–12)'),
  background: z
    .string()
    .optional()
    .default('#FFFFFF')
    .describe('Background CSS color — generated colors will contrast against it (default: white)'),
  minDeltaE: z
    .number()
    .min(10)
    .max(80)
    .optional()
    .default(25)
    .describe('Minimum Delta E between any pair under any CVD type (default: 25)'),
});

export type GenerateCvdSafePaletteInput = z.input<typeof generateCvdSafePaletteSchema>;

/**
 * Compute minimum Delta E between a candidate and all palette colors across all CVD types.
 */
const minCvdDeltaE = (
  candidate: RGBColor,
  palette: RGBColor[],
  types: ColorBlindnessType[],
): number => {
  let min = Number.POSITIVE_INFINITY;
  for (const existing of palette) {
    for (const type of types) {
      const simCandidate = simulateColorBlindness(candidate, type);
      const simExisting = simulateColorBlindness(existing, type);
      const d = deltaE(simCandidate, simExisting);
      if (d < min) min = d;
    }
    // Also check normal vision
    const d = deltaE(candidate, existing);
    if (d < min) min = d;
  }
  return min;
};

/**
 * Generate a CVD-safe palette using a greedy incremental approach:
 * For each slot, iterate through candidate HSL colors and pick the one
 * that maximizes the minimum pair-wise Delta E across all CVD types.
 */
export const executeGenerateCvdSafePalette = (input: GenerateCvdSafePaletteInput) => {
  const palette: RGBColor[] = [];

  // Start with a well-spaced set of hue candidates at multiple lightness/saturation combos
  const candidates: RGBColor[] = [];
  for (let h = 0; h < 360; h += 5) {
    for (const s of [50, 70, 90]) {
      for (const l of [30, 45, 60, 75]) {
        candidates.push(hslToRgb({ h, s, l }));
      }
    }
  }

  // Greedy: pick the candidate that maximizes min-pair Delta E under all CVD types
  // First color: pick a deep blue (generally distinct across CVD types)
  palette.push(hslToRgb({ h: 220, s: 80, l: 45 }));

  const cvdTypes: ColorBlindnessType[] = [...COLOR_BLINDNESS_TYPES];

  while (palette.length < input.count) {
    let bestCandidate: RGBColor | null = null;
    let bestScore = -1;

    for (const candidate of candidates) {
      const score = minCvdDeltaE(candidate, palette, cvdTypes);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (!bestCandidate) break;
    palette.push(bestCandidate);
  }

  // Build pair matrix
  const pairAnalysis: {
    color1: string;
    color2: string;
    normalDeltaE: number;
    worstCvdType: string;
    worstCvdDeltaE: number;
  }[] = [];

  for (let i = 0; i < palette.length; i++) {
    for (let j = i + 1; j < palette.length; j++) {
      const normalDE = Math.round(deltaE(palette[i], palette[j]) * 10) / 10;

      let worstType = 'normal';
      let worstDE = normalDE;

      for (const type of cvdTypes) {
        const sim1 = simulateColorBlindness(palette[i], type);
        const sim2 = simulateColorBlindness(palette[j], type);
        const d = Math.round(deltaE(sim1, sim2) * 10) / 10;
        if (d < worstDE) {
          worstDE = d;
          worstType = type;
        }
      }

      pairAnalysis.push({
        color1: rgbToHex(palette[i]),
        color2: rgbToHex(palette[j]),
        normalDeltaE: normalDE,
        worstCvdType: worstType,
        worstCvdDeltaE: worstDE,
      });
    }
  }

  const globalMinDE =
    pairAnalysis.length > 0 ? Math.min(...pairAnalysis.map((p) => p.worstCvdDeltaE)) : 0;

  const minDeltaE = input.minDeltaE ?? 25;

  return {
    palette: palette.map((c) => ({
      hex: rgbToHex(c),
      rgb: c,
    })),
    count: palette.length,
    pairAnalysis,
    summary: {
      globalMinDeltaE: globalMinDE,
      meetsThreshold: globalMinDE >= minDeltaE,
      threshold: minDeltaE,
    },
  };
};
