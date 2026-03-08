import { z } from 'zod';

import { apcaContrast, getApcaRecommendation, roundLc } from '../lib/apca.js';
import { parseColor, rgbToHex } from '../lib/color-parser.js';
import { contrastRatio, roundRatio } from '../lib/contrast.js';

export const apcaContrastSchema = z.object({
  textColor: z.string().describe('Text (foreground) CSS color'),
  backgroundColor: z.string().describe('Background CSS color'),
});

export type ApcaContrastInput = z.input<typeof apcaContrastSchema>;

export const executeApcaContrast = (input: ApcaContrastInput) => {
  const text = parseColor(input.textColor);
  const bg = parseColor(input.backgroundColor);

  const lc = roundLc(apcaContrast(text, bg));
  const wcag2Ratio = roundRatio(contrastRatio(text, bg));
  const polarity = lc > 0 ? 'dark-on-light' : lc < 0 ? 'light-on-dark' : 'none';

  return {
    textColor: { hex: rgbToHex(text), rgb: text },
    backgroundColor: { hex: rgbToHex(bg), rgb: bg },
    apca: {
      lc,
      absLc: Math.abs(lc),
      polarity,
      recommendation: getApcaRecommendation(lc),
    },
    wcag2: {
      ratio: wcag2Ratio,
      note: 'WCAG 2.x ratio provided for comparison',
    },
  };
};
