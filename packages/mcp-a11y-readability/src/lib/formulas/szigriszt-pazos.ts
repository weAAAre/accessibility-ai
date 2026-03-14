/**
 * @see Szigriszt Pazos, Francisco (1993). Sistemas predictivos de legibilidad
 * del mensaje escrito: fórmula de perspicuidad. Tesis doctoral.
 * @see Barrio, Inés (2008). Validación de la Escala INFLESZ.
 */

import type { FormulaDefinition, InterpretationLevel, TextStats } from '../../types.js';

const interpretSzigriszt = (score: number): InterpretationLevel => {
  if (score >= 86) return { score, label: 'muy fácil', gradeLevel: '6-10 años' };
  if (score >= 76) return { score, label: 'fácil', gradeLevel: '11 años' };
  if (score >= 66) return { score, label: 'bastante fácil', gradeLevel: '12 años' };
  if (score >= 51) return { score, label: 'normal', gradeLevel: 'popular' };
  if (score >= 36) return { score, label: 'bastante difícil', gradeLevel: 'cursos secundarios' };
  if (score >= 16)
    return { score, label: 'árido', gradeLevel: 'selectividad y estudios universitarios' };
  return { score, label: 'muy difícil', gradeLevel: 'titulados universitarios' };
};

const interpretInflesz = (score: number): InterpretationLevel => {
  if (score >= 80) return { score, label: 'muy fácil' };
  if (score >= 65) return { score, label: 'bastante fácil' };
  if (score >= 55) return { score, label: 'normal' };
  if (score >= 40) return { score, label: 'algo difícil' };
  return { score, label: 'muy difícil' };
};

const compute = (stats: TextStats): number =>
  206.835 - 62.3 * stats.avgSyllablesPerWord - stats.avgWordsPerSentence;

export const szigrisztPazos: FormulaDefinition = {
  id: 'szigriszt-pazos',
  name: 'Índice de perspicuidad de Szigriszt-Pazos',
  description:
    'Adaptación al español de la fórmula de Flesch (1993). Mide la perspicuidad (facilidad de comprensión) del texto.',
  language: 'es',
  reference: 'https://legible.es/blog/perspicuidad-szigriszt-pazos/',
  compute,
  interpret: interpretSzigriszt,
};

export const inflesz: FormulaDefinition = {
  id: 'inflesz',
  name: 'Escala INFLESZ',
  description:
    'Escala de Barrio-Cantalejo (2008) para interpretar la perspicuidad de Szigriszt-Pazos. Estándar en el ámbito sanitario español.',
  language: 'es',
  reference: 'https://legible.es/blog/escala-inflesz/',
  compute,
  interpret: interpretInflesz,
};
