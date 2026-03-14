import { describe, expect, it } from '@rstest/core';

import { computeTextStats } from '../src/lib/text-stats.js';

describe('computeTextStats — Spanish', () => {
  it('counts words and sentences in a simple Spanish text', () => {
    const text = 'El gato duerme. El perro come.';
    const stats = computeTextStats(text, 'es');

    expect(stats.words).toBe(6);
    expect(stats.sentences).toBe(2);
    expect(stats.avgWordsPerSentence).toBe(3);
  });

  it('handles Spanish punctuation marks ¡¿', () => {
    const text = '¡Hola! ¿Cómo estás?';
    const stats = computeTextStats(text, 'es');

    expect(stats.words).toBe(3);
    expect(stats.sentences).toBeGreaterThanOrEqual(2);
  });

  it('counts syllables for Spanish words', () => {
    const text = 'El gato duerme.';
    const stats = computeTextStats(text, 'es');

    expect(stats.syllables).toBeGreaterThan(0);
    expect(stats.avgSyllablesPerWord).toBeGreaterThan(1);
  });

  it('detects polysyllabic Spanish words (3+ syllables)', () => {
    const text = 'La comunicación internacional es extraordinariamente importante.';
    const stats = computeTextStats(text, 'es');

    expect(stats.polysyllabicWords).toBeGreaterThan(0);
  });

  it('returns zero stats for empty text', () => {
    const stats = computeTextStats('', 'es');

    expect(stats.words).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.syllables).toBe(0);
    expect(stats.avgSyllablesPerWord).toBe(0);
  });

  it('computes syllablesPerHundredWords and sentencesPerHundredWords', () => {
    const text = 'El gato duerme. El perro come.';
    const stats = computeTextStats(text, 'es');

    expect(stats.syllablesPerHundredWords).toBe(stats.avgSyllablesPerWord * 100);
    expect(stats.sentencesPerHundredWords).toBe((stats.sentences / stats.words) * 100);
  });
});

describe('computeTextStats — English', () => {
  it('counts words and sentences in a simple English text', () => {
    const text = 'The cat sleeps. The dog eats.';
    const stats = computeTextStats(text, 'en');

    expect(stats.words).toBe(6);
    expect(stats.sentences).toBe(2);
    expect(stats.avgWordsPerSentence).toBe(3);
  });

  it('counts syllables for English words', () => {
    const text = 'The cat sleeps.';
    const stats = computeTextStats(text, 'en');

    expect(stats.syllables).toBeGreaterThan(0);
  });

  it('detects polysyllabic English words', () => {
    const text = 'Communication is extraordinarily important for organizations.';
    const stats = computeTextStats(text, 'en');

    expect(stats.polysyllabicWords).toBeGreaterThan(0);
  });

  it('computes letter variance', () => {
    const text = 'I am ok.';
    const stats = computeTextStats(text, 'en');

    expect(stats.letterVariance).toBeGreaterThanOrEqual(0);
  });
});
