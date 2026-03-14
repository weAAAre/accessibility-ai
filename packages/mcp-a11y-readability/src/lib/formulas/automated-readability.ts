/**
 * @see Smith, E.A. and Senter, R.J. (1967). Automated Readability Index.
 * AMRL-TR-66-220.
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
  4.71 * (stats.letters / stats.words) + 0.5 * stats.avgWordsPerSentence - 21.43;

export const automatedReadability: FormulaDefinition = {
  id: 'automated-readability',
  name: 'Automated Readability Index (ARI)',
  description:
    'Uses character count and sentence length (1967). Designed for automated processing.',
  language: 'en',
  reference: 'https://en.wikipedia.org/wiki/Automated_readability_index',
  compute,
  interpret,
};
