import { z } from 'zod';

import { deltaE } from '../lib/color-blindness.js';
import { parseColor, rgbToHex } from '../lib/color-parser.js';
import {
  adjustForContrast,
  checkContrast,
  contrastRatio,
  getRequiredRatio,
  roundRatio,
} from '../lib/contrast.js';

export const analyzeDesignTokensSchema = z.object({
  tokens: z
    .record(z.string(), z.string())
    .describe(
      'Map of token name → CSS color value (e.g. { "text-primary": "#333", "bg-card": "#f5f5f5" })',
    ),
  textTokenPatterns: z
    .array(z.string())
    .optional()
    .default(['text', 'foreground', 'fg', 'color', 'heading', 'label', 'link', 'icon', 'border'])
    .describe(
      'Substrings that identify foreground/text tokens (default: text, foreground, fg, color, heading, label, link, icon, border)',
    ),
  backgroundTokenPatterns: z
    .array(z.string())
    .optional()
    .default(['bg', 'background', 'surface', 'card', 'page', 'canvas'])
    .describe(
      'Substrings that identify background tokens (default: bg, background, surface, card, page, canvas)',
    ),
  level: z.enum(['AA', 'AAA']).optional().default('AA').describe('Target WCAG level'),
  textSize: z
    .enum(['normal', 'large', 'ui'])
    .optional()
    .default('normal')
    .describe('Text size context'),
});

export type AnalyzeDesignTokensInput = z.input<typeof analyzeDesignTokensSchema>;

type TokenParsed = {
  name: string;
  value: string;
  hex: string;
  rgb: import('../types.js').RGBColor;
  role: 'text' | 'background' | 'ambiguous';
};

type TokenPairResult = {
  textToken: string;
  backgroundToken: string;
  ratio: number;
  pass: boolean;
  required: number;
  suggestion?: {
    adjustedHex: string;
    newRatio: number;
    deltaE: number;
  };
};

const classifyToken = (
  name: string,
  textPatterns: string[],
  bgPatterns: string[],
): 'text' | 'background' | 'ambiguous' => {
  const lower = name.toLowerCase();
  const isText = textPatterns.some((p) => lower.includes(p.toLowerCase()));
  const isBg = bgPatterns.some((p) => lower.includes(p.toLowerCase()));
  if (isText && !isBg) return 'text';
  if (isBg && !isText) return 'background';
  return 'ambiguous';
};

const DEFAULT_TEXT_PATTERNS = [
  'text',
  'foreground',
  'fg',
  'color',
  'heading',
  'label',
  'link',
  'icon',
  'border',
];
const DEFAULT_BG_PATTERNS = ['bg', 'background', 'surface', 'card', 'page', 'canvas'];

export const executeAnalyzeDesignTokens = (input: AnalyzeDesignTokensInput) => {
  const level = input.level ?? 'AA';
  const textSize = input.textSize ?? 'normal';
  const textPatterns = input.textTokenPatterns ?? DEFAULT_TEXT_PATTERNS;
  const bgPatterns = input.backgroundTokenPatterns ?? DEFAULT_BG_PATTERNS;
  const requiredRatio = getRequiredRatio(level, textSize);

  const tokens: TokenParsed[] = Object.entries(input.tokens).map(([name, value]) => {
    const rgb = parseColor(value);
    return {
      name,
      value,
      hex: rgbToHex(rgb),
      rgb,
      role: classifyToken(name, textPatterns, bgPatterns),
    };
  });

  const textTokens = tokens.filter((t) => t.role === 'text' || t.role === 'ambiguous');
  const bgTokens = tokens.filter((t) => t.role === 'background' || t.role === 'ambiguous');

  const results: TokenPairResult[] = [];
  const failures: TokenPairResult[] = [];

  for (const text of textTokens) {
    for (const bg of bgTokens) {
      if (text.name === bg.name) continue;

      const result = checkContrast(text.rgb, bg.rgb);
      const ratio = result.ratio;

      const passes = ratio >= requiredRatio;

      const pair: TokenPairResult = {
        textToken: text.name,
        backgroundToken: bg.name,
        ratio,
        pass: passes,
        required: requiredRatio,
      };

      if (!passes) {
        const adjusted = adjustForContrast(text.rgb, bg.rgb, requiredRatio);
        if (adjusted) {
          pair.suggestion = {
            adjustedHex: rgbToHex(adjusted),
            newRatio: roundRatio(contrastRatio(adjusted, bg.rgb)),
            deltaE: Math.round(deltaE(text.rgb, adjusted) * 10) / 10,
          };
        }
        failures.push(pair);
      }

      results.push(pair);
    }
  }

  const totalPairs = results.length;
  const passingPairs = totalPairs - failures.length;

  return {
    summary: {
      totalTokens: tokens.length,
      textTokens: textTokens.length,
      backgroundTokens: bgTokens.length,
      totalPairs,
      passingPairs,
      failingPairs: failures.length,
      passRate: totalPairs > 0 ? `${Math.round((passingPairs / totalPairs) * 100)}%` : 'N/A',
      level,
      textSize,
      required: requiredRatio,
    },
    tokens: tokens.map((t) => ({ name: t.name, hex: t.hex, role: t.role })),
    failures: failures.length > 0 ? failures : undefined,
    allPairs: results,
  };
};
