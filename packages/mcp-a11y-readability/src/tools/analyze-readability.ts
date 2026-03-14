import { z } from 'zod';

import { analyzeReadability } from '../lib/readability.js';

export const analyzeReadabilitySchema = z.object({
  text: z.string().min(1).describe('The text to analyze for readability'),
  lang: z.enum(['es', 'en']).describe('Language of the text: "es" for Spanish, "en" for English'),
});

export type AnalyzeReadabilityInput = z.input<typeof analyzeReadabilitySchema>;

export const executeAnalyzeReadability = (input: AnalyzeReadabilityInput) =>
  analyzeReadability(input.text, input.lang);
