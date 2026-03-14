import { z } from 'zod';

import { analyzeReadability } from '../lib/readability.js';
import type { ReadabilityReport } from '../types.js';

export const compareTextsSchema = z.object({
  textA: z.string().min(1).describe('First text to compare'),
  textB: z.string().min(1).describe('Second text to compare'),
  lang: z.enum(['es', 'en']).describe('Language of both texts: "es" for Spanish, "en" for English'),
});

export type CompareTextsInput = z.input<typeof compareTextsSchema>;

const pickFormulaScores = (report: ReadabilityReport): Record<string, number> => {
  const scores: Record<string, number> = {};
  for (const f of report.formulas) {
    scores[f.id] = f.score;
  }
  return scores;
};

export const executeCompareTexts = (input: CompareTextsInput) => {
  const reportA = analyzeReadability(input.textA, input.lang);
  const reportB = analyzeReadability(input.textB, input.lang);

  const scoresA = pickFormulaScores(reportA);
  const scoresB = pickFormulaScores(reportB);

  const differences: { formula: string; scoreA: number; scoreB: number; delta: number }[] = [];
  for (const id of Object.keys(scoresA)) {
    if (id in scoresB) {
      differences.push({
        formula: id,
        scoreA: scoresA[id],
        scoreB: scoresB[id],
        delta: Math.round((scoresB[id] - scoresA[id]) * 100) / 100,
      });
    }
  }

  return {
    language: input.lang,
    textA: {
      words: reportA.stats.words,
      sentences: reportA.stats.sentences,
      consensus: reportA.consensus,
    },
    textB: {
      words: reportB.stats.words,
      sentences: reportB.stats.sentences,
      consensus: reportB.consensus,
    },
    differences,
  };
};
