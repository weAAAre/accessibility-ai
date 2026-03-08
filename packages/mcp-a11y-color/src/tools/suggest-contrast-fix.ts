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

export type SuggestContrastFixInput = z.input<typeof suggestContrastFixSchema>;

export const executeSuggestContrastFix = (input: SuggestContrastFixInput) => {
  const fg = parseColor(input.foreground);
  const bg = parseColor(input.background);
  const level = input.level ?? 'AA';
  const textSize = input.textSize ?? 'normal';
  const currentRatio = roundRatio(contrastRatio(fg, bg));
  const targetRatio = getRequiredRatio(level, textSize);

  if (currentRatio >= targetRatio) {
    return {
      status: 'already_passing' as const,
      original: {
        foreground: rgbToHex(fg),
        background: rgbToHex(bg),
        ratio: currentRatio,
      },
      target: { level, textSize, required: targetRatio },
      message: `The color pair already meets ${level} for ${textSize} text (${currentRatio} ≥ ${targetRatio}).`,
    };
  }

  const suggested = adjustForContrast(fg, bg, targetRatio);

  if (!suggested) {
    return {
      status: 'no_fix_found' as const,
      original: {
        foreground: rgbToHex(fg),
        background: rgbToHex(bg),
        ratio: currentRatio,
      },
      target: { level, textSize, required: targetRatio },
      message: 'Could not find a suitable adjustment. Try changing the background color instead.',
    };
  }

  const newRatio = roundRatio(contrastRatio(suggested, bg));
  const colorDifference = Math.round(deltaE(fg, suggested) * 10) / 10;

  return {
    status: 'fixed' as const,
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
    target: { level, textSize, required: targetRatio },
    deltaE: colorDifference,
  };
};
