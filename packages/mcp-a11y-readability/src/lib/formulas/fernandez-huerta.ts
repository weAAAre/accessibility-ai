/**
 * @see Fernández Huerta J. (1959). Medidas sencillas de lecturabilidad.
 * Corrected per Gwillim Law (2011).
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpret = (score: number): InterpretationLevel => {
  if (score >= 90) return { score, label: 'muy fácil', gradeLevel: '4º grado' };
  if (score >= 80) return { score, label: 'fácil', gradeLevel: '5º grado' };
  if (score >= 70) return { score, label: 'algo fácil', gradeLevel: '6º grado' };
  if (score >= 60) return { score, label: 'normal (adulto)', gradeLevel: '7º-8º grado' };
  if (score >= 50) return { score, label: 'algo difícil', gradeLevel: 'preuniversitario' };
  if (score >= 30) return { score, label: 'difícil', gradeLevel: 'cursos selectivos' };
  return { score, label: 'muy difícil', gradeLevel: 'universitario' };
};

const compute = (stats: TextStats): number =>
  206.84 - 0.6 * stats.syllablesPerHundredWords - 1.02 * stats.avgWordsPerSentence;

export const fernandezHuerta: FormulaDefinition = {
  id: 'fernandez-huerta',
  name: 'Lecturabilidad de Fernández Huerta',
  description:
    'Adaptación al español de la fórmula de Flesch (1959). Mide la facilidad de lectura en una escala 0-100.',
  language: 'es',
  reference: 'https://legible.es/blog/lecturabilidad-fernandez-huerta/',
  compute,
  interpret,
};
