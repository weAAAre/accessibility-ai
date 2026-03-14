/**
 * @see Gunning, R. (1952). The Technique of Clear Writing. McGraw-Hill.
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  const rounded = Math.round(score * 10) / 10;
  if (rounded <= 6) return { score: rounded, label: 'easy', gradeLevel: '6th grade' };
  if (rounded <= 8) return { score: rounded, label: 'medium', gradeLevel: 'middle school' };
  if (rounded <= 12) return { score: rounded, label: 'hard', gradeLevel: 'high school' };
  if (rounded <= 16) return { score: rounded, label: 'very hard', gradeLevel: 'college' };
  return { score: rounded, label: 'extremely hard', gradeLevel: 'post-graduate' };
};

const compute = (stats: TextStats): number => {
  if (stats.words === 0) return 0;
  return 0.4 * (stats.avgWordsPerSentence + 100 * (stats.polysyllabicWords / stats.words));
};

export const gunningFog: FormulaDefinition = {
  id: 'gunning-fog',
  name: 'Gunning Fog Index',
  description:
    'Estimates the years of formal education needed. Uses sentence length and polysyllabic words (3+ syllables).',
  language: 'en',
  reference: 'https://en.wikipedia.org/wiki/Gunning_fog_index',
  compute,
  interpret,
};
