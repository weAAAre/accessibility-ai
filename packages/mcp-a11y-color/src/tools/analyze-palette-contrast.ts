import { z } from 'zod';

import { parseColor, rgbToHex } from '../lib/color-parser.js';
import { checkContrast } from '../lib/contrast.js';

export const analyzePaletteContrastSchema = z.object({
  colors: z
    .array(
      z.object({
        name: z.string().describe('Token name or label (e.g. "text-primary", "bg-card")'),
        value: z.string().describe('CSS color value'),
      }),
    )
    .min(2)
    .max(30)
    .describe('Colors to analyze as foreground/background combinations'),
  level: z.enum(['AA', 'AAA']).optional().default('AA').describe('WCAG level (default: AA)'),
});

export type AnalyzePaletteContrastInput = z.input<typeof analyzePaletteContrastSchema>;

type PairResult = {
  foreground: string;
  background: string;
  ratio: number;
  AA_normal: boolean;
  AA_large: boolean;
  AAA_normal: boolean;
  AAA_large: boolean;
  AA_ui: boolean;
};

export const executeAnalyzePaletteContrast = (input: AnalyzePaletteContrastInput) => {
  const parsed = input.colors.map((c) => ({
    name: c.name,
    value: c.value,
    rgb: parseColor(c.value),
    hex: rgbToHex(parseColor(c.value)),
  }));

  const pairs: PairResult[] = [];
  const failures: PairResult[] = [];
  const targetLevel = input.level;

  for (const fg of parsed) {
    for (const bg of parsed) {
      if (fg.name === bg.name) continue;

      const result = checkContrast(fg.rgb, bg.rgb);
      const pair: PairResult = {
        foreground: fg.name,
        background: bg.name,
        ratio: result.ratio,
        AA_normal: result.level.AA_normal,
        AA_large: result.level.AA_large,
        AAA_normal: result.level.AAA_normal,
        AAA_large: result.level.AAA_large,
        AA_ui: result.level.AA_ui,
      };

      pairs.push(pair);

      const passes = targetLevel === 'AAA' ? result.level.AAA_normal : result.level.AA_normal;
      if (!passes) {
        failures.push(pair);
      }
    }
  }

  const totalPairs = pairs.length;
  const passingPairs = totalPairs - failures.length;

  return {
    summary: {
      totalColors: parsed.length,
      totalPairs,
      passingPairs,
      failingPairs: failures.length,
      passRate: `${Math.round((passingPairs / totalPairs) * 100)}%`,
      level: targetLevel,
    },
    colors: parsed.map((c) => ({ name: c.name, hex: c.hex })),
    pairs,
    failures: failures.length > 0 ? failures : undefined,
  };
};
