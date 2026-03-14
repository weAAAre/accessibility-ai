/**
 * @see García López, José Antonio (1999). Edad mínima para entender un texto.
 * Adaptation of Flesch to Spanish returning minimum age.
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  const rounded = Math.round(score * 10) / 10;
  if (rounded <= 8) return { score: rounded, label: 'infantil', gradeLevel: '≤8 años' };
  if (rounded <= 12) return { score: rounded, label: 'primaria', gradeLevel: `${rounded} años` };
  if (rounded <= 16) return { score: rounded, label: 'secundaria', gradeLevel: `${rounded} años` };
  if (rounded <= 18)
    return { score: rounded, label: 'preuniversitario', gradeLevel: `${rounded} años` };
  return { score: rounded, label: 'universitario', gradeLevel: `${rounded} años` };
};

const compute = (stats: TextStats): number =>
  0.2495 * stats.avgWordsPerSentence + 6.4763 * stats.avgSyllablesPerWord - 7.1395;

export const garciaLopez: FormulaDefinition = {
  id: 'garcia-lopez',
  name: 'Edad mínima de García López',
  description: 'Calcula la edad mínima necesaria para comprender un texto en español (1999).',
  language: 'es',
  reference: 'https://legible.es/blog/garcia-lopez/',
  compute,
  interpret,
};
