/**
 * @see Crawford, Alan N. (1989). Fórmula y gráfico para determinar la
 * comprensibilidad de textos de nivel primario en castellano.
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  const rounded = Math.round(score * 10) / 10;
  if (rounded <= 1) return { score: rounded, label: '1º primaria', gradeLevel: '1' };
  if (rounded <= 2) return { score: rounded, label: '2º primaria', gradeLevel: '2' };
  if (rounded <= 3) return { score: rounded, label: '3º primaria', gradeLevel: '3' };
  if (rounded <= 4) return { score: rounded, label: '4º primaria', gradeLevel: '4' };
  if (rounded <= 5) return { score: rounded, label: '5º primaria', gradeLevel: '5' };
  if (rounded <= 6) return { score: rounded, label: '6º primaria', gradeLevel: '6' };
  return { score: rounded, label: 'superior a primaria', gradeLevel: '6+' };
};

const compute = (stats: TextStats): number =>
  -0.205 * stats.sentencesPerHundredWords + 0.049 * stats.syllablesPerHundredWords - 3.407;

export const crawford: FormulaDefinition = {
  id: 'crawford',
  name: 'Fórmula de Crawford',
  description:
    'Calcula los años de escolaridad necesarios para entender un texto en español (1989). Solo para nivel primaria.',
  language: 'es',
  reference: 'https://legible.es/blog/formula-de-crawford/',
  compute,
  interpret,
};
