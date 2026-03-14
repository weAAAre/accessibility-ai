/**
 * @see Flesch, R. (1948). A new readability yardstick. Journal of Applied Psychology 32:221-33.
 * @see https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  if (score >= 90) return { score, label: 'very easy', gradeLevel: '5th grade' };
  if (score >= 80) return { score, label: 'easy', gradeLevel: '6th grade' };
  if (score >= 70) return { score, label: 'fairly easy', gradeLevel: '7th grade' };
  if (score >= 60) return { score, label: 'standard', gradeLevel: '8th-9th grade' };
  if (score >= 50) return { score, label: 'fairly difficult', gradeLevel: '10th-12th grade' };
  if (score >= 30) return { score, label: 'difficult', gradeLevel: 'college' };
  return { score, label: 'very confusing', gradeLevel: 'college graduate' };
};

const compute = (stats: TextStats): number =>
  206.835 - 1.015 * stats.avgWordsPerSentence - 84.6 * stats.avgSyllablesPerWord;

export const fleschReadingEase: FormulaDefinition = {
  id: 'flesch-reading-ease',
  name: 'Flesch Reading Ease',
  description: 'Measures text readability on a 0-100 scale. Higher scores indicate easier text.',
  language: 'en',
  reference: 'https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests',
  compute,
  interpret,
};
