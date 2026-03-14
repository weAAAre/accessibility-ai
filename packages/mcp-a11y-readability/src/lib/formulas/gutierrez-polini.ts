/**
 * @see Gutiérrez de Polini, L.E. (1972). Investigación sobre lectura en Venezuela.
 * First formula designed natively for Spanish (not an adaptation).
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  if (score >= 80) return { score, label: 'muy fácil' };
  if (score >= 60) return { score, label: 'fácil' };
  if (score >= 40) return { score, label: 'normal' };
  if (score >= 20) return { score, label: 'difícil' };
  return { score, label: 'muy difícil' };
};

const compute = (stats: TextStats): number =>
  95.2 - 9.7 * stats.avgLettersPerWord - 0.35 * stats.avgWordsPerSentence;

export const gutierrezPolini: FormulaDefinition = {
  id: 'gutierrez-polini',
  name: 'Comprensibilidad de Gutiérrez de Polini',
  description:
    'Primera fórmula concebida nativamente para el español (1972). No usa conteo de sílabas.',
  language: 'es',
  reference: 'https://legible.es/blog/comprensibilidad-gutierrez-de-polini/',
  compute,
  interpret,
};
