import { z } from 'zod';

import { computeTextStats } from '../lib/text-stats.js';

export const getTextStatsSchema = z.object({
  text: z.string().min(1).describe('The text to analyze'),
  lang: z.enum(['es', 'en']).describe('Language of the text: "es" for Spanish, "en" for English'),
});

export type GetTextStatsInput = z.input<typeof getTextStatsSchema>;

export const executeGetTextStats = (input: GetTextStatsInput) =>
  computeTextStats(input.text, input.lang);
