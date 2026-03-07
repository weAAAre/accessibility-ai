/**
 * get-color-info tool
 * Parses any CSS color and returns all representations + accessibility metadata.
 */

import { z } from 'zod';
import { getColorInfo, parseColor, rgbToHex } from '../lib/color-parser.js';
import { contrastRatio, roundRatio } from '../lib/contrast.js';

export const getColorInfoSchema = z.object({
  color: z.string().describe('Any valid CSS color (hex, rgb, rgba, hsl, hsla, named color)'),
});

export type GetColorInfoInput = z.infer<typeof getColorInfoSchema>;

export function executeGetColorInfo(input: GetColorInfoInput) {
  const info = getColorInfo(input.color);
  const white = parseColor('#ffffff');
  const black = parseColor('#000000');
  const rgb = parseColor(input.color);

  return {
    hex: info.hex,
    rgb: info.rgb,
    hsl: info.hsl,
    relativeLuminance: Math.round(info.relativeLuminance * 10000) / 10000,
    isLight: info.isLight,
    contrastOnWhite: roundRatio(contrastRatio(rgb, white)),
    contrastOnBlack: roundRatio(contrastRatio(rgb, black)),
  };
}
