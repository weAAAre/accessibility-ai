/**
 * @see Muñoz, M. y Muñoz, J. (2006). Legibilidad Mμ. Viña del Mar, Chile.
 * Uses word count, mean letters per word and variance — no syllable counting.
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  if (score >= 91) return { score, label: 'muy fácil' };
  if (score >= 81) return { score, label: 'fácil' };
  if (score >= 71) return { score, label: 'un poco fácil' };
  if (score >= 61) return { score, label: 'adecuado' };
  if (score >= 51) return { score, label: 'un poco difícil' };
  if (score >= 31) return { score, label: 'difícil' };
  return { score, label: 'muy difícil' };
};

const compute = (stats: TextStats): number => {
  if (stats.words <= 1 || stats.letterVariance === 0) return 0;
  return (stats.words / (stats.words - 1)) * (stats.avgLettersPerWord / stats.letterVariance) * 100;
};

export const legibilidadMu: FormulaDefinition = {
  id: 'legibilidad-mu',
  name: 'Legibilidad µ (mu)',
  description:
    'Fórmula chilena (2006) que usa la media y varianza de la longitud de las palabras. No necesita contar sílabas.',
  language: 'es',
  reference: 'https://legible.es/blog/legibilidad-mu/',
  compute,
  interpret,
};
