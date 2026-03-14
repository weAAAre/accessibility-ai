import type { FormulaResult, Language, ReadabilityReport, TextStats } from '../types.js';

import { getFormulasForLanguage } from './formulas/registry.js';
import { computeTextStats } from './text-stats.js';

const round = (n: number): number => Math.round(n * 100) / 100;

const computeConsensus = (
  results: FormulaResult[],
  lang: Language,
): { label: string; detail: string } => {
  if (results.length === 0) return { label: 'unknown', detail: 'No formulas available' };

  if (lang === 'es') {
    const scaleFormulas = results.filter(
      (r) =>
        r.id === 'fernandez-huerta' ||
        r.id === 'szigriszt-pazos' ||
        r.id === 'inflesz' ||
        r.id === 'gutierrez-polini',
    );

    if (scaleFormulas.length === 0) return { label: 'unknown', detail: 'Insufficient data' };

    const avg = scaleFormulas.reduce((sum, r) => sum + r.score, 0) / scaleFormulas.length;

    if (avg >= 80) return { label: 'muy fácil', detail: `Promedio escala 0-100: ${round(avg)}` };
    if (avg >= 65)
      return { label: 'bastante fácil', detail: `Promedio escala 0-100: ${round(avg)}` };
    if (avg >= 55) return { label: 'normal', detail: `Promedio escala 0-100: ${round(avg)}` };
    if (avg >= 40) return { label: 'algo difícil', detail: `Promedio escala 0-100: ${round(avg)}` };
    return { label: 'muy difícil', detail: `Promedio escala 0-100: ${round(avg)}` };
  }

  const gradeFormulas = results.filter(
    (r) =>
      r.id === 'flesch-kincaid-grade' ||
      r.id === 'gunning-fog' ||
      r.id === 'smog' ||
      r.id === 'coleman-liau' ||
      r.id === 'automated-readability',
  );

  if (gradeFormulas.length === 0) return { label: 'unknown', detail: 'Insufficient data' };

  const scores = gradeFormulas.map((r) => r.score).sort((a, b) => a - b);
  const median = scores[Math.floor(scores.length / 2)];

  if (median <= 6) return { label: 'easy', detail: `Median grade level: ${round(median)}` };
  if (median <= 9) return { label: 'moderate', detail: `Median grade level: ${round(median)}` };
  if (median <= 12) return { label: 'hard', detail: `Median grade level: ${round(median)}` };
  return { label: 'very hard', detail: `Median grade level: ${round(median)}` };
};

export const analyzeReadability = (text: string, lang: Language): ReadabilityReport => {
  const stats = computeTextStats(text, lang);
  const formulas = getFormulasForLanguage(lang);

  const results: FormulaResult[] = formulas.map((formula) => {
    const score = round(formula.compute(stats));
    return {
      id: formula.id,
      name: formula.name,
      score,
      interpretation: formula.interpret(score),
      reference: formula.reference,
    };
  });

  return {
    language: lang,
    stats,
    formulas: results,
    consensus: computeConsensus(results, lang),
  };
};

export const analyzeWithFormula = (
  text: string,
  lang: Language,
  formulaId: string,
): FormulaResult | null => {
  const stats = computeTextStats(text, lang);
  const formulas = getFormulasForLanguage(lang);
  const formula = formulas.find((f) => f.id === formulaId);

  if (!formula) return null;

  const score = round(formula.compute(stats));
  return {
    id: formula.id,
    name: formula.name,
    score,
    interpretation: formula.interpret(score),
    reference: formula.reference,
  };
};

export const suggestImprovements = (stats: TextStats, lang: Language): string[] => {
  const suggestions: string[] = [];

  const sentenceThreshold = lang === 'es' ? 25 : 20;
  if (stats.avgWordsPerSentence > sentenceThreshold) {
    suggestions.push(
      lang === 'es'
        ? `Las frases tienen una media de ${round(stats.avgWordsPerSentence)} palabras. Intenta que no superen las ${sentenceThreshold}.`
        : `Average sentence length is ${round(stats.avgWordsPerSentence)} words. Try to keep it under ${sentenceThreshold}.`,
    );
  }

  const syllableThreshold = lang === 'es' ? 2.0 : 1.6;
  if (stats.avgSyllablesPerWord > syllableThreshold) {
    suggestions.push(
      lang === 'es'
        ? `La media de sílabas por palabra es ${round(stats.avgSyllablesPerWord)}. Usa palabras más cortas cuando sea posible.`
        : `Average syllables per word is ${round(stats.avgSyllablesPerWord)}. Use shorter words when possible.`,
    );
  }

  if (stats.words > 0) {
    const polysyllabicPct = round((stats.polysyllabicWords / stats.words) * 100);
    if (polysyllabicPct > 15) {
      suggestions.push(
        lang === 'es'
          ? `El ${polysyllabicPct}% de las palabras tienen 3 o más sílabas. Reduce el vocabulario complejo.`
          : `${polysyllabicPct}% of words have 3 or more syllables. Reduce complex vocabulary.`,
      );
    }
  }

  if (suggestions.length === 0) {
    suggestions.push(
      lang === 'es'
        ? 'El texto tiene buena legibilidad. No se detectan mejoras obvias.'
        : 'The text has good readability. No obvious improvements detected.',
    );
  }

  return suggestions;
};
