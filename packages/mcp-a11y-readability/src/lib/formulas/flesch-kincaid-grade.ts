/**
 * @see Kincaid, J.P. et al. (1975). Derivation of new readability formulas for
 * Navy enlisted personnel. CNTECHTRA Research Branch Report 8-75.
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

const compute = (stats: TextStats): number =>
  0.39 * stats.avgWordsPerSentence + 11.8 * stats.avgSyllablesPerWord - 15.59;

export const fleschKincaidGrade: FormulaDefinition = {
  id: 'flesch-kincaid-grade',
  name: 'Flesch-Kincaid Grade Level',
  description: 'Returns the U.S. school grade level needed to understand the text.',
  language: 'en',
  reference: 'https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests',
  compute,
  interpret,
};
