import { z } from 'zod';
import { parseColor, rgbToHex } from '../lib/color-parser.js';
import { checkContrast, isLargeText } from '../lib/contrast.js';

export const checkContrastSchema = z.object({
  foreground: z.string().describe('Foreground CSS color (hex, rgb, hsl, named)'),
  background: z.string().describe('Background CSS color (hex, rgb, hsl, named)'),
  fontSize: z
    .number()
    .optional()
    .describe('Font size in px (to auto-determine normal vs large text)'),
  fontWeight: z
    .enum(['normal', 'bold'])
    .optional()
    .describe('Font weight — "bold" lowers the large-text threshold to 14pt (18.5px)'),
});

export type CheckContrastInput = z.input<typeof checkContrastSchema>;

export const executeCheckContrast = (input: CheckContrastInput) => {
  const fg = parseColor(input.foreground);
  const bg = parseColor(input.background);
  const result = checkContrast(fg, bg);

  const textSize =
    input.fontSize !== undefined
      ? isLargeText(input.fontSize, input.fontWeight === 'bold')
        ? 'large'
        : 'normal'
      : undefined;

  return {
    contrastRatio: result.ratio,
    foreground: { hex: rgbToHex(fg), rgb: fg },
    background: { hex: rgbToHex(bg), rgb: bg },
    textSize: textSize ?? 'unknown (provide fontSize to determine)',
    results: {
      wcag2_AA_normal: { required: 4.5, pass: result.level.AA_normal },
      wcag2_AA_large: { required: 3, pass: result.level.AA_large },
      wcag2_AAA_normal: { required: 7, pass: result.level.AAA_normal },
      wcag2_AAA_large: { required: 4.5, pass: result.level.AAA_large },
      wcag2_AA_ui: { required: 3, pass: result.level.AA_ui },
    },
  };
};
