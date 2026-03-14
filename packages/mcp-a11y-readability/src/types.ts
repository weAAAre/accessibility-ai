export type Language = 'es' | 'en';

export const LANGUAGES: Language[] = ['es', 'en'];

export type TextStats = {
  sentences: number;
  words: number;
  syllables: number;
  characters: number;
  letters: number;
  avgSyllablesPerWord: number;
  avgWordsPerSentence: number;
  avgLettersPerWord: number;
  letterVariance: number;
  syllablesPerHundredWords: number;
  sentencesPerHundredWords: number;
  polysyllabicWords: number;
};

export type InterpretationLevel = {
  score: number;
  label: string;
  gradeLevel?: string;
};

export type FormulaResult = {
  id: string;
  name: string;
  score: number;
  interpretation: InterpretationLevel;
  reference: string;
};

export type FormulaDefinition = {
  id: string;
  name: string;
  description: string;
  language: Language;
  reference: string;
  compute: (stats: TextStats) => number;
  interpret: (score: number) => InterpretationLevel;
};

export type ReadabilityReport = {
  language: Language;
  stats: TextStats;
  formulas: FormulaResult[];
  consensus: {
    label: string;
    detail: string;
  };
};
