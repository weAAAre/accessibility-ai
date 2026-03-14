import { describe, expect, it } from '@rstest/core';

import { executeAnalyzeReadability } from '../src/tools/analyze-readability.js';
import { executeAnalyzeReadabilityFormula } from '../src/tools/analyze-readability-formula.js';
import { executeCompareTexts } from '../src/tools/compare-texts.js';
import { executeGetTextStats } from '../src/tools/get-text-stats.js';
import { executeListFormulas } from '../src/tools/list-formulas.js';
import { executeSuggestReadabilityImprovements } from '../src/tools/suggest-readability-improvements.js';

const SPANISH_TEXT = 'El gato duerme en la casa. El sol sale cada día.';
const ENGLISH_TEXT = 'The cat sleeps in the house. The sun rises every day.';

describe('analyze-readability tool', () => {
  it('returns a full Spanish report', () => {
    const result = executeAnalyzeReadability({ text: SPANISH_TEXT, lang: 'es' });

    expect(result.language).toBe('es');
    expect(result.formulas.length).toBe(7);
    expect(result.stats.words).toBeGreaterThan(0);
    expect(result.consensus.label).toBeDefined();
  });

  it('returns a full English report', () => {
    const result = executeAnalyzeReadability({ text: ENGLISH_TEXT, lang: 'en' });

    expect(result.language).toBe('en');
    expect(result.formulas.length).toBe(6);
    expect(result.stats.words).toBeGreaterThan(0);
    expect(result.consensus.label).toBeDefined();
  });
});

describe('analyze-readability-formula tool', () => {
  it('returns result for a valid Spanish formula', () => {
    const result = executeAnalyzeReadabilityFormula({
      text: SPANISH_TEXT,
      lang: 'es',
      formula: 'fernandez-huerta',
    });

    expect('score' in result).toBe(true);
  });

  it('returns error for an invalid formula', () => {
    const result = executeAnalyzeReadabilityFormula({
      text: SPANISH_TEXT,
      lang: 'es',
      formula: 'nonexistent',
    });

    expect('error' in result).toBe(true);
  });
});

describe('get-text-stats tool', () => {
  it('returns stats for Spanish text', () => {
    const result = executeGetTextStats({ text: SPANISH_TEXT, lang: 'es' });

    expect(result.words).toBeGreaterThan(0);
    expect(result.sentences).toBeGreaterThan(0);
    expect(result.syllables).toBeGreaterThan(0);
  });

  it('returns stats for English text', () => {
    const result = executeGetTextStats({ text: ENGLISH_TEXT, lang: 'en' });

    expect(result.words).toBeGreaterThan(0);
    expect(result.sentences).toBeGreaterThan(0);
    expect(result.syllables).toBeGreaterThan(0);
  });
});

describe('list-formulas tool', () => {
  it('lists all formulas when no language specified', () => {
    const result = executeListFormulas({});

    expect(result.count).toBe(13);
    expect(result.formulas).toHaveLength(13);
  });

  it('lists only Spanish formulas', () => {
    const result = executeListFormulas({ lang: 'es' });

    expect(result.count).toBe(7);
    for (const f of result.formulas) {
      expect(f.language).toBe('es');
    }
  });

  it('lists only English formulas', () => {
    const result = executeListFormulas({ lang: 'en' });

    expect(result.count).toBe(6);
    for (const f of result.formulas) {
      expect(f.language).toBe('en');
    }
  });
});

describe('suggest-readability-improvements tool', () => {
  it('returns suggestions array', () => {
    const result = executeSuggestReadabilityImprovements({
      text: SPANISH_TEXT,
      lang: 'es',
    });

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.language).toBe('es');
  });
});

describe('compare-texts tool', () => {
  it('compares two Spanish texts', () => {
    const result = executeCompareTexts({
      textA: 'El gato duerme en la casa.',
      textB: 'La epistemología contemporánea fundamenta sus presupuestos metodológicos.',
      lang: 'es',
    });

    expect(result.textA.words).toBeGreaterThan(0);
    expect(result.textB.words).toBeGreaterThan(0);
    expect(result.differences.length).toBeGreaterThan(0);
  });
});
