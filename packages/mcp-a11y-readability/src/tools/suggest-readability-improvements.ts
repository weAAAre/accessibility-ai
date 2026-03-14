import { z } from 'zod';

import { suggestImprovements } from '../lib/readability.js';
import { computeTextStats } from '../lib/text-stats.js';

export const suggestReadabilityImprovementsSchema = z.object({
  text: z.string().min(1).describe('The text to analyze for improvement suggestions'),
  lang: z.enum(['es', 'en']).describe('Language of the text: "es" for Spanish, "en" for English'),
});

export type SuggestReadabilityImprovementsInput = z.input<
  typeof suggestReadabilityImprovementsSchema
>;

export const executeSuggestReadabilityImprovements = (
  input: SuggestReadabilityImprovementsInput,
) => {
  const stats = computeTextStats(input.text, input.lang);
  const suggestions = suggestImprovements(stats, input.lang);

  return {
    language: input.lang,
    stats: {
      sentences: stats.sentences,
      words: stats.words,
      avgWordsPerSentence: stats.avgWordsPerSentence,
      avgSyllablesPerWord: stats.avgSyllablesPerWord,
      polysyllabicWords: stats.polysyllabicWords,
    },
    suggestions,
  };
};
