import { describe, expect, it } from '@rstest/core';

import { crawford } from '../src/lib/formulas/crawford.js';
import { fernandezHuerta } from '../src/lib/formulas/fernandez-huerta.js';
import { garciaLopez } from '../src/lib/formulas/garcia-lopez.js';
import { gutierrezPolini } from '../src/lib/formulas/gutierrez-polini.js';
import { legibilidadMu } from '../src/lib/formulas/legibilidad-mu.js';
import {
  getFormulaById,
  getFormulaIds,
  getFormulasForLanguage,
} from '../src/lib/formulas/registry.js';
import { inflesz, szigrisztPazos } from '../src/lib/formulas/szigriszt-pazos.js';
import { computeTextStats } from '../src/lib/text-stats.js';
import type { TextStats } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helper: build a synthetic TextStats to test formulas with exact known inputs.
// This lets us verify the math against hand-calculated values from the original
// papers and the legible.es reference site.
// ---------------------------------------------------------------------------

const syntheticStats = (overrides: Partial<TextStats>): TextStats => ({
  sentences: 0,
  words: 0,
  syllables: 0,
  characters: 0,
  letters: 0,
  avgSyllablesPerWord: 0,
  avgWordsPerSentence: 0,
  avgLettersPerWord: 0,
  letterVariance: 0,
  syllablesPerHundredWords: 0,
  sentencesPerHundredWords: 0,
  polysyllabicWords: 0,
  ...overrides,
});

const round2 = (n: number): number => Math.round(n * 100) / 100;

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  FERNÁNDEZ HUERTA (1959)                                                  ║
// ║  Formula: 206.84 − 0.60·P − 1.02·F                                       ║
// ║    P = syllables per 100 words                                            ║
// ║    F = average words per sentence                                         ║
// ║  @see Fernández Huerta J. (1959). Medidas sencillas de lecturabilidad.    ║
// ║  @see https://legible.es/blog/lecturabilidad-fernandez-huerta/            ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Fernández Huerta — compute()', () => {
  it('formula: 206.84 − 0.60·P − 1.02·F with P=200, F=10', () => {
    const stats = syntheticStats({ syllablesPerHundredWords: 200, avgWordsPerSentence: 10 });
    expect(round2(fernandezHuerta.compute(stats))).toBe(76.64);
  });

  it('formula with P=300, F=25 (difficult academic text)', () => {
    const stats = syntheticStats({ syllablesPerHundredWords: 300, avgWordsPerSentence: 25 });
    expect(round2(fernandezHuerta.compute(stats))).toBe(1.34);
  });

  it('formula with P=150, F=8 (very easy children text)', () => {
    const stats = syntheticStats({ syllablesPerHundredWords: 150, avgWordsPerSentence: 8 });
    expect(round2(fernandezHuerta.compute(stats))).toBe(108.68);
  });

  it('formula with P=0, F=0 returns the constant 206.84', () => {
    const stats = syntheticStats({ syllablesPerHundredWords: 0, avgWordsPerSentence: 0 });
    expect(round2(fernandezHuerta.compute(stats))).toBe(206.84);
  });

  it('score decreases as syllable density increases', () => {
    const base = syntheticStats({ syllablesPerHundredWords: 180, avgWordsPerSentence: 12 });
    const denser = syntheticStats({ syllablesPerHundredWords: 250, avgWordsPerSentence: 12 });
    expect(fernandezHuerta.compute(base)).toBeGreaterThan(fernandezHuerta.compute(denser));
  });

  it('score decreases as sentence length increases', () => {
    const short = syntheticStats({ syllablesPerHundredWords: 200, avgWordsPerSentence: 10 });
    const long = syntheticStats({ syllablesPerHundredWords: 200, avgWordsPerSentence: 25 });
    expect(fernandezHuerta.compute(short)).toBeGreaterThan(fernandezHuerta.compute(long));
  });
});

describe('Fernández Huerta — interpret() boundary values', () => {
  it('score ≥ 90 → muy fácil', () => {
    expect(fernandezHuerta.interpret(90).label).toBe('muy fácil');
    expect(fernandezHuerta.interpret(100).label).toBe('muy fácil');
  });

  it('score 80–89 → fácil', () => {
    expect(fernandezHuerta.interpret(80).label).toBe('fácil');
    expect(fernandezHuerta.interpret(89).label).toBe('fácil');
  });

  it('score 70–79 → algo fácil', () => {
    expect(fernandezHuerta.interpret(70).label).toBe('algo fácil');
    expect(fernandezHuerta.interpret(79).label).toBe('algo fácil');
  });

  it('score 60–69 → normal (adulto)', () => {
    expect(fernandezHuerta.interpret(60).label).toBe('normal (adulto)');
    expect(fernandezHuerta.interpret(69).label).toBe('normal (adulto)');
  });

  it('score 50–59 → algo difícil', () => {
    expect(fernandezHuerta.interpret(50).label).toBe('algo difícil');
    expect(fernandezHuerta.interpret(59).label).toBe('algo difícil');
  });

  it('score 30–49 → difícil', () => {
    expect(fernandezHuerta.interpret(30).label).toBe('difícil');
    expect(fernandezHuerta.interpret(49).label).toBe('difícil');
  });

  it('score < 30 → muy difícil', () => {
    expect(fernandezHuerta.interpret(29).label).toBe('muy difícil');
    expect(fernandezHuerta.interpret(0).label).toBe('muy difícil');
    expect(fernandezHuerta.interpret(-10).label).toBe('muy difícil');
  });

  it('gradeLevel is always present', () => {
    for (const score of [0, 30, 50, 60, 70, 80, 90]) {
      expect(fernandezHuerta.interpret(score).gradeLevel).toBeDefined();
    }
  });

  it('score is echoed back in interpretation', () => {
    expect(fernandezHuerta.interpret(55).score).toBe(55);
  });
});

describe('Fernández Huerta — metadata', () => {
  it('has correct id and language', () => {
    expect(fernandezHuerta.id).toBe('fernandez-huerta');
    expect(fernandezHuerta.language).toBe('es');
  });

  it('references legible.es', () => {
    expect(fernandezHuerta.reference).toContain('legible.es');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  SZIGRISZT-PAZOS (1993)                                                   ║
// ║  Formula: 206.835 − 62.3·(syl/word) − (words/sentence)                   ║
// ║  @see Szigriszt Pazos, Francisco (1993). Tesis doctoral, UCM.             ║
// ║  @see https://legible.es/blog/perspicuidad-szigriszt-pazos/               ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Szigriszt-Pazos — compute()', () => {
  it('formula: 206.835 − 62.3·S − W with S=2.0, W=15', () => {
    const stats = syntheticStats({ avgSyllablesPerWord: 2.0, avgWordsPerSentence: 15 });
    expect(round2(szigrisztPazos.compute(stats))).toBe(67.24);
  });

  it('formula with S=1.5, W=10 (easy text)', () => {
    const stats = syntheticStats({ avgSyllablesPerWord: 1.5, avgWordsPerSentence: 10 });
    expect(round2(szigrisztPazos.compute(stats))).toBe(103.39);
  });

  it('formula with S=3.0, W=30 (very difficult text)', () => {
    const stats = syntheticStats({ avgSyllablesPerWord: 3.0, avgWordsPerSentence: 30 });
    expect(round2(szigrisztPazos.compute(stats))).toBe(-10.06);
  });

  it('formula with S=0, W=0 returns the constant 206.835', () => {
    const stats = syntheticStats({ avgSyllablesPerWord: 0, avgWordsPerSentence: 0 });
    expect(round2(szigrisztPazos.compute(stats))).toBe(206.84);
  });

  it('score decreases as syllables per word increase', () => {
    const low = syntheticStats({ avgSyllablesPerWord: 1.5, avgWordsPerSentence: 15 });
    const high = syntheticStats({ avgSyllablesPerWord: 2.5, avgWordsPerSentence: 15 });
    expect(szigrisztPazos.compute(low)).toBeGreaterThan(szigrisztPazos.compute(high));
  });
});

describe('Szigriszt-Pazos — interpret() boundary values', () => {
  it('score ≥ 86 → muy fácil', () => {
    expect(szigrisztPazos.interpret(86).label).toBe('muy fácil');
    expect(szigrisztPazos.interpret(100).label).toBe('muy fácil');
  });

  it('score 76–85 → fácil', () => {
    expect(szigrisztPazos.interpret(76).label).toBe('fácil');
    expect(szigrisztPazos.interpret(85).label).toBe('fácil');
  });

  it('score 66–75 → bastante fácil', () => {
    expect(szigrisztPazos.interpret(66).label).toBe('bastante fácil');
    expect(szigrisztPazos.interpret(75).label).toBe('bastante fácil');
  });

  it('score 51–65 → normal', () => {
    expect(szigrisztPazos.interpret(51).label).toBe('normal');
    expect(szigrisztPazos.interpret(65).label).toBe('normal');
  });

  it('score 36–50 → bastante difícil', () => {
    expect(szigrisztPazos.interpret(36).label).toBe('bastante difícil');
    expect(szigrisztPazos.interpret(50).label).toBe('bastante difícil');
  });

  it('score 16–35 → árido', () => {
    expect(szigrisztPazos.interpret(16).label).toBe('árido');
    expect(szigrisztPazos.interpret(35).label).toBe('árido');
  });

  it('score < 16 → muy difícil', () => {
    expect(szigrisztPazos.interpret(15).label).toBe('muy difícil');
    expect(szigrisztPazos.interpret(0).label).toBe('muy difícil');
  });

  it('gradeLevel is always provided', () => {
    for (const score of [0, 16, 36, 51, 66, 76, 86]) {
      expect(szigrisztPazos.interpret(score).gradeLevel).toBeDefined();
    }
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  INFLESZ — Escala Barrio-Cantalejo (2008)                                ║
// ║  Same formula as Szigriszt-Pazos, different interpretation scale.          ║
// ║  @see Barrio-Cantalejo, I.M. (2008). Validación de la Escala INFLESZ.    ║
// ║  @see https://legible.es/blog/escala-inflesz/                             ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('INFLESZ — compute() shares formula with Szigriszt-Pazos', () => {
  it('returns identical scores for the same input', () => {
    const stats = syntheticStats({ avgSyllablesPerWord: 2.2, avgWordsPerSentence: 18 });
    expect(inflesz.compute(stats)).toBe(szigrisztPazos.compute(stats));
  });

  it('shares identity across multiple different inputs', () => {
    const inputs = [
      { avgSyllablesPerWord: 1.0, avgWordsPerSentence: 5 },
      { avgSyllablesPerWord: 2.5, avgWordsPerSentence: 20 },
      { avgSyllablesPerWord: 3.5, avgWordsPerSentence: 35 },
    ];
    for (const input of inputs) {
      const stats = syntheticStats(input);
      expect(inflesz.compute(stats)).toBe(szigrisztPazos.compute(stats));
    }
  });
});

describe('INFLESZ — interpret() uses healthcare scale (Barrio-Cantalejo 2008)', () => {
  it('score ≥ 80 → muy fácil', () => {
    expect(inflesz.interpret(80).label).toBe('muy fácil');
    expect(inflesz.interpret(100).label).toBe('muy fácil');
  });

  it('score 65–79 → bastante fácil', () => {
    expect(inflesz.interpret(65).label).toBe('bastante fácil');
    expect(inflesz.interpret(79).label).toBe('bastante fácil');
  });

  it('score 55–64 → normal', () => {
    expect(inflesz.interpret(55).label).toBe('normal');
    expect(inflesz.interpret(64).label).toBe('normal');
  });

  it('score 40–54 → algo difícil', () => {
    expect(inflesz.interpret(40).label).toBe('algo difícil');
    expect(inflesz.interpret(54).label).toBe('algo difícil');
  });

  it('score < 40 → muy difícil', () => {
    expect(inflesz.interpret(39).label).toBe('muy difícil');
    expect(inflesz.interpret(0).label).toBe('muy difícil');
  });

  it('differs from Szigriszt-Pazos at score 50', () => {
    expect(inflesz.interpret(50).label).toBe('algo difícil');
    expect(szigrisztPazos.interpret(50).label).toBe('bastante difícil');
  });

  it('differs from Szigriszt-Pazos at score 85', () => {
    expect(inflesz.interpret(85).label).toBe('muy fácil');
    expect(szigrisztPazos.interpret(85).label).toBe('fácil');
  });
});

describe('INFLESZ — metadata', () => {
  it('has correct id and language', () => {
    expect(inflesz.id).toBe('inflesz');
    expect(inflesz.language).toBe('es');
  });

  it('references legible.es', () => {
    expect(inflesz.reference).toContain('legible.es');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  GUTIÉRREZ DE POLINI (1972)                                               ║
// ║  Formula: 95.2 − 9.7·L − 0.35·F                                          ║
// ║    L = average letters per word                                           ║
// ║    F = average words per sentence                                         ║
// ║  First formula natively designed for Spanish (not Flesch adaptation).      ║
// ║  @see Gutiérrez de Polini, L.E. (1972). Investigación sobre lectura en    ║
// ║       Venezuela.                                                          ║
// ║  @see https://legible.es/blog/comprensibilidad-gutierrez-de-polini/       ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Gutiérrez de Polini — compute()', () => {
  it('formula: 95.2 − 9.7·L − 0.35·F with L=4.5, F=12', () => {
    const stats = syntheticStats({ avgLettersPerWord: 4.5, avgWordsPerSentence: 12 });
    expect(round2(gutierrezPolini.compute(stats))).toBe(47.35);
  });

  it('formula with L=3.5, F=8 (easy text)', () => {
    const stats = syntheticStats({ avgLettersPerWord: 3.5, avgWordsPerSentence: 8 });
    expect(round2(gutierrezPolini.compute(stats))).toBe(58.45);
  });

  it('formula with L=7.0, F=30 (academic text)', () => {
    const stats = syntheticStats({ avgLettersPerWord: 7.0, avgWordsPerSentence: 30 });
    expect(round2(gutierrezPolini.compute(stats))).toBe(16.8);
  });

  it('formula with L=0, F=0 returns the constant 95.2', () => {
    const stats = syntheticStats({ avgLettersPerWord: 0, avgWordsPerSentence: 0 });
    expect(round2(gutierrezPolini.compute(stats))).toBe(95.2);
  });

  it('does not use syllable counts (syllable-independent)', () => {
    const a = syntheticStats({
      avgLettersPerWord: 5,
      avgWordsPerSentence: 10,
      avgSyllablesPerWord: 1,
    });
    const b = syntheticStats({
      avgLettersPerWord: 5,
      avgWordsPerSentence: 10,
      avgSyllablesPerWord: 5,
    });
    expect(gutierrezPolini.compute(a)).toBe(gutierrezPolini.compute(b));
  });

  it('score decreases as word length increases', () => {
    const short = syntheticStats({ avgLettersPerWord: 4, avgWordsPerSentence: 10 });
    const long = syntheticStats({ avgLettersPerWord: 7, avgWordsPerSentence: 10 });
    expect(gutierrezPolini.compute(short)).toBeGreaterThan(gutierrezPolini.compute(long));
  });
});

describe('Gutiérrez de Polini — interpret() boundary values', () => {
  it('score ≥ 80 → muy fácil', () => {
    expect(gutierrezPolini.interpret(80).label).toBe('muy fácil');
    expect(gutierrezPolini.interpret(95).label).toBe('muy fácil');
  });

  it('score 60–79 → fácil', () => {
    expect(gutierrezPolini.interpret(60).label).toBe('fácil');
    expect(gutierrezPolini.interpret(79).label).toBe('fácil');
  });

  it('score 40–59 → normal', () => {
    expect(gutierrezPolini.interpret(40).label).toBe('normal');
    expect(gutierrezPolini.interpret(59).label).toBe('normal');
  });

  it('score 20–39 → difícil', () => {
    expect(gutierrezPolini.interpret(20).label).toBe('difícil');
    expect(gutierrezPolini.interpret(39).label).toBe('difícil');
  });

  it('score < 20 → muy difícil', () => {
    expect(gutierrezPolini.interpret(19).label).toBe('muy difícil');
    expect(gutierrezPolini.interpret(0).label).toBe('muy difícil');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  CRAWFORD (1989)                                                          ║
// ║  Formula: −0.205·SL + 0.049·SP − 3.407                                   ║
// ║    SL = sentences per 100 words                                           ║
// ║    SP = syllables per 100 words                                           ║
// ║  Returns years of schooling (primary level only).                         ║
// ║  @see Crawford, Alan N. (1989). Fórmula y gráfico para determinar la     ║
// ║       comprensibilidad de textos de nivel primario en castellano.         ║
// ║  @see https://legible.es/blog/formula-de-crawford/                        ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Crawford — compute()', () => {
  it('formula: −0.205·SL + 0.049·SP − 3.407 with SL=10, SP=150', () => {
    const stats = syntheticStats({ sentencesPerHundredWords: 10, syllablesPerHundredWords: 150 });
    expect(round2(crawford.compute(stats))).toBe(1.89);
  });

  it('formula with SL=5, SP=200 (harder text → higher grade)', () => {
    const stats = syntheticStats({ sentencesPerHundredWords: 5, syllablesPerHundredWords: 200 });
    expect(round2(crawford.compute(stats))).toBe(5.37);
  });

  it('formula with SL=20, SP=130 (many short sentences → lower grade)', () => {
    const stats = syntheticStats({ sentencesPerHundredWords: 20, syllablesPerHundredWords: 130 });
    expect(round2(crawford.compute(stats))).toBe(-1.14);
  });

  it('formula with SL=0, SP=0 returns −3.407', () => {
    const stats = syntheticStats({ sentencesPerHundredWords: 0, syllablesPerHundredWords: 0 });
    expect(round2(crawford.compute(stats))).toBe(-3.41);
  });

  it('grade increases as syllable density increases', () => {
    const low = syntheticStats({ sentencesPerHundredWords: 8, syllablesPerHundredWords: 140 });
    const high = syntheticStats({ sentencesPerHundredWords: 8, syllablesPerHundredWords: 220 });
    expect(crawford.compute(high)).toBeGreaterThan(crawford.compute(low));
  });

  it('grade decreases as sentences per 100 words increase', () => {
    const few = syntheticStats({ sentencesPerHundredWords: 5, syllablesPerHundredWords: 180 });
    const many = syntheticStats({ sentencesPerHundredWords: 15, syllablesPerHundredWords: 180 });
    expect(crawford.compute(few)).toBeGreaterThan(crawford.compute(many));
  });
});

describe('Crawford — interpret() grade levels', () => {
  it('score ≤ 1 → 1º primaria', () => {
    expect(crawford.interpret(0.5).label).toBe('1º primaria');
    expect(crawford.interpret(1.0).label).toBe('1º primaria');
  });

  it('score 1.1–2 → 2º primaria', () => {
    expect(crawford.interpret(1.5).label).toBe('2º primaria');
    expect(crawford.interpret(2.0).label).toBe('2º primaria');
  });

  it('score 2.1–3 → 3º primaria', () => {
    expect(crawford.interpret(2.5).label).toBe('3º primaria');
    expect(crawford.interpret(3.0).label).toBe('3º primaria');
  });

  it('score 3.1–4 → 4º primaria', () => {
    expect(crawford.interpret(3.5).label).toBe('4º primaria');
  });

  it('score 4.1–5 → 5º primaria', () => {
    expect(crawford.interpret(4.5).label).toBe('5º primaria');
  });

  it('score 5.1–6 → 6º primaria', () => {
    expect(crawford.interpret(5.5).label).toBe('6º primaria');
  });

  it('score > 6 → superior a primaria', () => {
    expect(crawford.interpret(7).label).toBe('superior a primaria');
    expect(crawford.interpret(10).label).toBe('superior a primaria');
  });

  it('always includes gradeLevel', () => {
    for (const score of [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 7]) {
      expect(crawford.interpret(score).gradeLevel).toBeDefined();
    }
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  LEGIBILIDAD µ (mu) — Muñoz & Muñoz (2006)                               ║
// ║  Formula: (n/(n−1)) · (mean/variance) · 100                              ║
// ║    n = word count                                                         ║
// ║    mean = average letters per word                                        ║
// ║    variance = letter-length variance                                      ║
// ║  No syllable counting needed.                                             ║
// ║  @see Muñoz, M. y Muñoz, J. (2006). Legibilidad Mμ. Viña del Mar.       ║
// ║  @see https://legible.es/blog/legibilidad-mu/                             ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Legibilidad µ — compute()', () => {
  it('formula: (n/(n−1))·(mean/var)·100 with n=100, mean=4.5, var=3.0', () => {
    const stats = syntheticStats({
      words: 100,
      avgLettersPerWord: 4.5,
      letterVariance: 3.0,
    });
    expect(round2(legibilidadMu.compute(stats))).toBe(151.52);
  });

  it('formula with n=50, mean=5.0, var=2.0', () => {
    const stats = syntheticStats({
      words: 50,
      avgLettersPerWord: 5.0,
      letterVariance: 2.0,
    });
    expect(round2(legibilidadMu.compute(stats))).toBe(255.1);
  });

  it('formula with n=10, mean=3.0, var=1.5', () => {
    const stats = syntheticStats({
      words: 10,
      avgLettersPerWord: 3.0,
      letterVariance: 1.5,
    });
    // (10/9) · (3.0/1.5) · 100 = 1.1111... · 2 · 100 = 222.222...
    expect(round2(legibilidadMu.compute(stats))).toBe(222.22);
  });

  it('returns 0 when variance is 0 (all words same length)', () => {
    const stats = syntheticStats({ words: 10, avgLettersPerWord: 5.0, letterVariance: 0 });
    expect(legibilidadMu.compute(stats)).toBe(0);
  });

  it('returns 0 when words ≤ 1 (insufficient data)', () => {
    const stats = syntheticStats({ words: 1, avgLettersPerWord: 5.0, letterVariance: 2.0 });
    expect(legibilidadMu.compute(stats)).toBe(0);
  });

  it('returns 0 when words = 0', () => {
    const stats = syntheticStats({ words: 0, avgLettersPerWord: 0, letterVariance: 0 });
    expect(legibilidadMu.compute(stats)).toBe(0);
  });

  it('does not use syllable counts (syllable-independent)', () => {
    const a = syntheticStats({
      words: 20,
      avgLettersPerWord: 4,
      letterVariance: 2,
      syllables: 10,
    });
    const b = syntheticStats({
      words: 20,
      avgLettersPerWord: 4,
      letterVariance: 2,
      syllables: 100,
    });
    expect(legibilidadMu.compute(a)).toBe(legibilidadMu.compute(b));
  });

  it('higher variance → lower µ (text is harder to read)', () => {
    const lowVar = syntheticStats({ words: 50, avgLettersPerWord: 5, letterVariance: 1 });
    const highVar = syntheticStats({ words: 50, avgLettersPerWord: 5, letterVariance: 5 });
    expect(legibilidadMu.compute(lowVar)).toBeGreaterThan(legibilidadMu.compute(highVar));
  });
});

describe('Legibilidad µ — interpret() boundary values', () => {
  it('score ≥ 91 → muy fácil', () => {
    expect(legibilidadMu.interpret(91).label).toBe('muy fácil');
    expect(legibilidadMu.interpret(150).label).toBe('muy fácil');
  });

  it('score 81–90 → fácil', () => {
    expect(legibilidadMu.interpret(81).label).toBe('fácil');
    expect(legibilidadMu.interpret(90).label).toBe('fácil');
  });

  it('score 71–80 → un poco fácil', () => {
    expect(legibilidadMu.interpret(71).label).toBe('un poco fácil');
    expect(legibilidadMu.interpret(80).label).toBe('un poco fácil');
  });

  it('score 61–70 → adecuado', () => {
    expect(legibilidadMu.interpret(61).label).toBe('adecuado');
    expect(legibilidadMu.interpret(70).label).toBe('adecuado');
  });

  it('score 51–60 → un poco difícil', () => {
    expect(legibilidadMu.interpret(51).label).toBe('un poco difícil');
    expect(legibilidadMu.interpret(60).label).toBe('un poco difícil');
  });

  it('score 31–50 → difícil', () => {
    expect(legibilidadMu.interpret(31).label).toBe('difícil');
    expect(legibilidadMu.interpret(50).label).toBe('difícil');
  });

  it('score ≤ 30 → muy difícil', () => {
    expect(legibilidadMu.interpret(30).label).toBe('muy difícil');
    expect(legibilidadMu.interpret(0).label).toBe('muy difícil');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  GARCÍA LÓPEZ (1999)                                                      ║
// ║  Formula: 0.2495·F + 6.4763·S − 7.1395                                   ║
// ║    F = average words per sentence                                         ║
// ║    S = average syllables per word                                         ║
// ║  Returns minimum age to comprehend the text.                              ║
// ║  @see García López, José Antonio (1999). Edad mínima para entender un     ║
// ║       texto.                                                              ║
// ║  @see https://legible.es/blog/garcia-lopez/                               ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('García López — compute()', () => {
  it('formula: 0.2495·F + 6.4763·S − 7.1395 with F=10, S=2.0', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 10, avgSyllablesPerWord: 2.0 });
    expect(round2(garciaLopez.compute(stats))).toBe(8.31);
  });

  it('formula with F=6, S=1.5 (children text → low age)', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 6, avgSyllablesPerWord: 1.5 });
    expect(round2(garciaLopez.compute(stats))).toBe(4.07);
  });

  it('formula with F=25, S=3.0 (academic text → high age)', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 25, avgSyllablesPerWord: 3.0 });
    expect(round2(garciaLopez.compute(stats))).toBe(18.53);
  });

  it('formula with F=0, S=0 returns −7.1395', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 0, avgSyllablesPerWord: 0 });
    expect(round2(garciaLopez.compute(stats))).toBe(-7.14);
  });

  it('age increases with sentence length', () => {
    const short = syntheticStats({ avgWordsPerSentence: 8, avgSyllablesPerWord: 2.0 });
    const long = syntheticStats({ avgWordsPerSentence: 20, avgSyllablesPerWord: 2.0 });
    expect(garciaLopez.compute(long)).toBeGreaterThan(garciaLopez.compute(short));
  });

  it('age increases with syllable complexity', () => {
    const simple = syntheticStats({ avgWordsPerSentence: 12, avgSyllablesPerWord: 1.5 });
    const complex = syntheticStats({ avgWordsPerSentence: 12, avgSyllablesPerWord: 3.0 });
    expect(garciaLopez.compute(complex)).toBeGreaterThan(garciaLopez.compute(simple));
  });
});

describe('García López — interpret() age ranges', () => {
  it('score ≤ 8 → infantil', () => {
    expect(garciaLopez.interpret(6).label).toBe('infantil');
    expect(garciaLopez.interpret(8).label).toBe('infantil');
  });

  it('score 8.1–12 → primaria', () => {
    expect(garciaLopez.interpret(9).label).toBe('primaria');
    expect(garciaLopez.interpret(12).label).toBe('primaria');
  });

  it('score 12.1–16 → secundaria', () => {
    expect(garciaLopez.interpret(13).label).toBe('secundaria');
    expect(garciaLopez.interpret(16).label).toBe('secundaria');
  });

  it('score 16.1–18 → preuniversitario', () => {
    expect(garciaLopez.interpret(17).label).toBe('preuniversitario');
    expect(garciaLopez.interpret(18).label).toBe('preuniversitario');
  });

  it('score > 18 → universitario', () => {
    expect(garciaLopez.interpret(19).label).toBe('universitario');
    expect(garciaLopez.interpret(25).label).toBe('universitario');
  });

  it('includes gradeLevel with age annotation', () => {
    expect(garciaLopez.interpret(10).gradeLevel).toContain('años');
  });

  it('infantil range uses ≤8 años in gradeLevel', () => {
    expect(garciaLopez.interpret(7).gradeLevel).toBe('≤8 años');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  CROSS-FORMULA: easy text vs hard text (integration with real text)       ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Spanish formulas — easy vs hard real text integration', () => {
  const EASY =
    'El gato duerme en la casa. El sol sale cada día. Los niños juegan en el parque. La niña come pan. El perro corre rápido.';
  const HARD =
    'La epistemología contemporánea fundamenta sus presupuestos metodológicos en la hermenéutica fenomenológica, deconstruyendo paradigmáticamente las estructuras axiomáticas de la racionalidad instrumental positivista.';

  it('all ease-scale formulas score the easy text higher', () => {
    const easyStats = computeTextStats(EASY, 'es');
    const hardStats = computeTextStats(HARD, 'es');

    expect(fernandezHuerta.compute(easyStats)).toBeGreaterThan(fernandezHuerta.compute(hardStats));
    expect(szigrisztPazos.compute(easyStats)).toBeGreaterThan(szigrisztPazos.compute(hardStats));
    expect(gutierrezPolini.compute(easyStats)).toBeGreaterThan(gutierrezPolini.compute(hardStats));
  });

  it('grade/age formulas return lower values for easy text', () => {
    const easyStats = computeTextStats(EASY, 'es');
    const hardStats = computeTextStats(HARD, 'es');

    expect(crawford.compute(easyStats)).toBeLessThan(crawford.compute(hardStats));
    expect(garciaLopez.compute(easyStats)).toBeLessThan(garciaLopez.compute(hardStats));
  });

  it('easy text classified as fácil/normal range by fernandez-huerta', () => {
    const stats = computeTextStats(EASY, 'es');
    const score = fernandezHuerta.compute(stats);
    const interp = fernandezHuerta.interpret(score);
    expect(['muy fácil', 'fácil', 'algo fácil']).toContain(interp.label);
  });

  it('hard text classified as difícil/muy difícil by fernandez-huerta', () => {
    const stats = computeTextStats(HARD, 'es');
    const score = fernandezHuerta.compute(stats);
    const interp = fernandezHuerta.interpret(score);
    expect(['difícil', 'muy difícil', 'algo difícil']).toContain(interp.label);
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  REGISTRY — Spanish formulas                                              ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Formula registry — Spanish', () => {
  it('returns exactly 7 formulas for Spanish', () => {
    expect(getFormulasForLanguage('es')).toHaveLength(7);
  });

  it('contains all expected formula IDs', () => {
    const ids = getFormulaIds('es');
    const expected = [
      'fernandez-huerta',
      'szigriszt-pazos',
      'inflesz',
      'gutierrez-polini',
      'crawford',
      'legibilidad-mu',
      'garcia-lopez',
    ];
    for (const id of expected) {
      expect(ids).toContain(id);
    }
  });

  it('getFormulaById finds each formula', () => {
    for (const id of getFormulaIds('es')) {
      const formula = getFormulaById(id, 'es');
      expect(formula).toBeDefined();
      expect(formula?.id).toBe(id);
    }
  });

  it('all Spanish formulas have language "es"', () => {
    for (const f of getFormulasForLanguage('es')) {
      expect(f.language).toBe('es');
    }
  });

  it('all Spanish formulas have a valid reference URL', () => {
    for (const f of getFormulasForLanguage('es')) {
      expect(f.reference).toMatch(/^https?:\/\//);
    }
  });

  it('all Spanish formulas have a non-empty description', () => {
    for (const f of getFormulasForLanguage('es')) {
      expect(f.description.length).toBeGreaterThan(10);
    }
  });

  it('getFormulaById returns undefined for unknown id', () => {
    expect(getFormulaById('nonexistent', 'es')).toBeUndefined();
  });
});
