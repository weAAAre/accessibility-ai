/**
 * suggest-contrast-fix tool
 * Given a failing color pair, suggests the closest accessible alternative.
 */

import { z } from 'zod';
import { deltaE } from '../lib/color-blindness.js';
import { parseColor, rgbToHex } from '../lib/color-parser.js';
import { adjustForContrast, contrastRatio, getRequiredRatio, roundRatio } from '../lib/contrast.js';

export const suggestContrastFixSchema = z.object({
  foreground: z.string().describe('Current foreground CSS color'),
  background: z.string().describe('Current background CSS color'),
  level: z.enum(['AA', 'AAA']).optional().default('AA').describe('Target WCAG level (default: AA)'),
  textSize: z
    .enum(['normal', 'large', 'ui'])
    .optional()
    .default('normal')
    .describe('Text size context (default: normal)'),
});

export type SuggestContrastFixInput = z.infer<typeof suggestContrastFixSchema>;

export function executeSuggestContrastFix(input: SuggestContrastFixInput) {
  const fg = parseColor(input.foreground);
  const bg = parseColor(input.background);
  const currentRatio = roundRatio(contrastRatio(fg, bg));
  const targetRatio = getRequiredRatio(input.level, input.textSize);

  if (currentRatio >= targetRatio) {
    return {
      status: 'already_passing',
      original: {
        foreground: rgbToHex(fg),
        background: rgbToHex(bg),
        ratio: currentRatio,
      },
      target: { level: input.level, textSize: input.textSize, required: targetRatio },
      message: `The color pair already meets ${input.level} for ${input.textSize} text (${currentRatio} ≥ ${targetRatio}).`,
    };
  }

  const suggested = adjustForContrast(fg, bg, targetRatio);

  if (!suggested) {
    return {
      status: 'no_fix_found',
      original: {
        foreground: rgbToHex(fg),
        background: rgbToHex(bg),
        ratio: currentRatio,
      },
      target: { level: input.level, textSize: input.textSize, required: targetRatio },
      message: 'Could not find a suitable adjustment. Try changing the background color instead.',
    };
  }

  const newRatio = roundRatio(contrastRatio(suggested, bg));
  const colorDifference = Math.round(deltaE(fg, suggested) * 10) / 10;

  return {
    status: 'fixed',
    original: {
      foreground: rgbToHex(fg),
      background: rgbToHex(bg),
      ratio: currentRatio,
    },
    suggested: {
      foreground: rgbToHex(suggested),
      background: rgbToHex(bg),
      ratio: newRatio,
    },
    target: { level: input.level, textSize: input.textSize, required: targetRatio },
    deltaE: colorDifference,
  };
}
