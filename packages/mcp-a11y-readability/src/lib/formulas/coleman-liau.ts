/**
 * @see Coleman, M. and Liau, T. (1975). A computer readability formula designed
 * for machine scoring. Journal of Applied Psychology 60:283-284.
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  const rounded = Math.round(score * 10) / 10;
  if (rounded <= 5) return { score: rounded, label: 'elementary', gradeLevel: `grade ${rounded}` };
  if (rounded <= 8)
    return { score: rounded, label: 'middle school', gradeLevel: `grade ${rounded}` };
  if (rounded <= 12)
    return { score: rounded, label: 'high school', gradeLevel: `grade ${rounded}` };
  return { score: rounded, label: 'college level', gradeLevel: `grade ${rounded}` };
};

const compute = (stats: TextStats): number => {
  const lettersPer100Words = (stats.letters / stats.words) * 100;
  const sentencesPer100Words = stats.sentencesPerHundredWords;
  return 0.0588 * lettersPer100Words - 0.296 * sentencesPer100Words - 15.8;
};

export const colemanLiau: FormulaDefinition = {
  id: 'coleman-liau',
  name: 'Coleman-Liau Index',
  description: 'Uses character count instead of syllables (1975). Designed for machine scoring.',
  language: 'en',
  reference: 'https://en.wikipedia.org/wiki/Coleman%E2%80%93Liau_index',
  compute,
  interpret,
};
