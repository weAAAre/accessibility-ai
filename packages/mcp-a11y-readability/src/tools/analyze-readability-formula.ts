import { z } from 'zod';

import { getFormulaIds } from '../lib/formulas/registry.js';
import { analyzeWithFormula } from '../lib/readability.js';

export const analyzeReadabilityFormulaSchema = z.object({
  text: z.string().min(1).describe('The text to analyze'),
  lang: z.enum(['es', 'en']).describe('Language of the text: "es" for Spanish, "en" for English'),
  formula: z
    .string()
    .describe('Formula ID to use (e.g. "fernandez-huerta", "flesch-reading-ease")'),
});

export type AnalyzeReadabilityFormulaInput = z.input<typeof analyzeReadabilityFormulaSchema>;

export const executeAnalyzeReadabilityFormula = (input: AnalyzeReadabilityFormulaInput) => {
  const result = analyzeWithFormula(input.text, input.lang, input.formula);

  if (!result) {
    const available = getFormulaIds(input.lang);
    return {
      error: `Formula "${input.formula}" not found for language "${input.lang}".`,
      availableFormulas: available,
    };
  }

  return result;
};
