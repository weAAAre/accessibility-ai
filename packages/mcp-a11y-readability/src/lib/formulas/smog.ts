/**
 * @see McLaughlin, G.H. (1969). SMOG grading — a new readability formula.
 * Journal of Reading 22:639-646.
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  const rounded = Math.round(score * 10) / 10;
  if (rounded <= 6) return { score: rounded, label: 'easy', gradeLevel: '6th grade' };
  if (rounded <= 9) return { score: rounded, label: 'moderate', gradeLevel: 'middle school' };
  if (rounded <= 12) return { score: rounded, label: 'hard', gradeLevel: 'high school' };
  return { score: rounded, label: 'very hard', gradeLevel: 'college' };
};

const compute = (stats: TextStats): number => {
  if (stats.sentences === 0) return 0;
  return 1.043 * Math.sqrt(stats.polysyllabicWords * (30 / stats.sentences)) + 3.1291;
};

export const smog: FormulaDefinition = {
  id: 'smog',
  name: 'SMOG Index',
  description:
    'Simple Measure of Gobbledygook (1969). Recommended for healthcare texts. Uses polysyllabic word count.',
  language: 'en',
  reference: 'https://en.wikipedia.org/wiki/SMOG',
  compute,
  interpret,
};
