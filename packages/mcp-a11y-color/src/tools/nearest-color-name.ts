import { z } from 'zod';

import { findNearestColorNames } from '../lib/color-names.js';
import { parseColor, rgbToHex, rgbToHsl } from '../lib/color-parser.js';

export const nearestColorNameSchema = z.object({
  color: z.string().describe('Any valid CSS color (hex, rgb, hsl, named)'),
  count: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .default(3)
    .describe('Number of nearest names to return (default: 3, max: 10)'),
});

export type NearestColorNameInput = z.input<typeof nearestColorNameSchema>;

export const executeNearestColorName = (input: NearestColorNameInput) => {
  const rgb = parseColor(input.color);
  const count = input.count ?? 3;
  const matches = findNearestColorNames(rgb, count);

  return {
    input: {
      hex: rgbToHex(rgb),
      rgb,
      hsl: rgbToHsl(rgb),
    },
    matches: matches.map((m) => ({
      name: m.name,
      hex: m.hex,
      rgb: m.rgb,
      deltaE: m.deltaE,
      exact: m.exact,
    })),
    bestMatch: matches[0].name,
    isExact: matches[0].exact,
  };
};
