import { z } from 'zod';
import { deltaE, simulateColorBlindness } from '../lib/color-blindness.js';
import { parseColor, rgbToHex } from '../lib/color-parser.js';
import type { ColorBlindnessType } from '../types.js';
import { COLOR_BLINDNESS_TYPES } from '../types.js';

export const simulateColorBlindnessSchema = z.object({
  colors: z.array(z.string()).min(1).max(20).describe('Array of CSS colors to simulate'),
  type: z
    .enum([
      'all',
      'protanopia',
      'protanomaly',
      'deuteranopia',
      'deuteranomaly',
      'tritanopia',
      'tritanomaly',
      'achromatopsia',
      'achromatomaly',
    ])
    .optional()
    .default('all')
    .describe('CVD type to simulate, or "all" for all 8 types (default: all)'),
});

export type SimulateColorBlindnessInput = z.input<typeof simulateColorBlindnessSchema>;

export const executeSimulateColorBlindness = (input: SimulateColorBlindnessInput) => {
  const parsedColors = input.colors.map((c) => ({
    original: c,
    rgb: parseColor(c),
  }));

  const types: ColorBlindnessType[] =
    input.type === 'all' ? [...COLOR_BLINDNESS_TYPES] : [input.type as ColorBlindnessType];

  const simulations: Record<
    string,
    { colors: string[]; pairContrasts?: { pair: string; ratio: number }[] }
  > = {};
  const warnings: string[] = [];

  for (const type of types) {
    const simulatedColors = parsedColors.map((c) => {
      const simulated = simulateColorBlindness(c.rgb, type);
      return rgbToHex(simulated);
    });

    const entry: { colors: string[]; pairContrasts?: { pair: string; ratio: number }[] } = {
      colors: simulatedColors,
    };

    // If multiple colors, check pair distinguishability
    if (parsedColors.length >= 2) {
      const pairContrasts: { pair: string; ratio: number }[] = [];
      for (let i = 0; i < parsedColors.length; i++) {
        for (let j = i + 1; j < parsedColors.length; j++) {
          const sim1 = simulateColorBlindness(parsedColors[i].rgb, type);
          const sim2 = simulateColorBlindness(parsedColors[j].rgb, type);
          const de = Math.round(deltaE(sim1, sim2) * 10) / 10;

          pairContrasts.push({
            pair: `${input.colors[i]} / ${input.colors[j]}`,
            ratio: de,
          });

          if (de < 20) {
            warnings.push(
              `${input.colors[i]} and ${input.colors[j]} become hard to distinguish under ${type} (Delta E: ${de})`,
            );
          }
        }
      }
      entry.pairContrasts = pairContrasts;
    }

    simulations[type] = entry;
  }

  return {
    original: input.colors,
    simulations,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};
