import { describe, expect, it } from '@rstest/core';

import { automatedReadability } from '../src/lib/formulas/automated-readability.js';
import { colemanLiau } from '../src/lib/formulas/coleman-liau.js';
import { fleschKincaidGrade } from '../src/lib/formulas/flesch-kincaid-grade.js';
import { fleschReadingEase } from '../src/lib/formulas/flesch-reading-ease.js';
import { gunningFog } from '../src/lib/formulas/gunning-fog.js';
import {
  getFormulaById,
  getFormulaIds,
  getFormulasForLanguage,
} from '../src/lib/formulas/registry.js';
import { smog } from '../src/lib/formulas/smog.js';
import { computeTextStats } from '../src/lib/text-stats.js';
import type { TextStats } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helper: build a synthetic TextStats to test formulas with exact known inputs
// against hand-calculated values from their original papers.
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
// ║  FLESCH READING EASE (1948)                                               ║
// ║  Formula: 206.835 − 1.015·W − 84.6·S                                     ║
// ║    W = average words per sentence                                         ║
// ║    S = average syllables per word                                         ║
// ║  @see Flesch, R. (1948). A new readability yardstick.                     ║
// ║       Journal of Applied Psychology 32:221-33.                            ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Flesch Reading Ease — compute()', () => {
  it('formula: 206.835 − 1.015·W − 84.6·S with W=15, S=1.5', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 15, avgSyllablesPerWord: 1.5 });
    expect(round2(fleschReadingEase.compute(stats))).toBe(64.71);
  });

  it('formula with W=10, S=1.2 (very easy text)', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 10, avgSyllablesPerWord: 1.2 });
    // 206.835 − 10.15 − 101.52 = 95.165
    expect(round2(fleschReadingEase.compute(stats))).toBe(95.17);
  });

  it('formula with W=25, S=2.5 (very difficult text → negative score)', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 25, avgSyllablesPerWord: 2.5 });
    // 206.835 − 25.375 − 211.5 = −30.04
    expect(round2(fleschReadingEase.compute(stats))).toBe(-30.04);
  });

  it('formula with W=0, S=0 returns the constant 206.835', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 0, avgSyllablesPerWord: 0 });
    expect(round2(fleschReadingEase.compute(stats))).toBe(206.84);
  });

  it('score decreases as syllables per word increase', () => {
    const fewer = syntheticStats({ avgWordsPerSentence: 15, avgSyllablesPerWord: 1.2 });
    const more = syntheticStats({ avgWordsPerSentence: 15, avgSyllablesPerWord: 2.5 });
    expect(fleschReadingEase.compute(fewer)).toBeGreaterThan(fleschReadingEase.compute(more));
  });

  it('score decreases as sentence length increases', () => {
    const short = syntheticStats({ avgWordsPerSentence: 10, avgSyllablesPerWord: 1.5 });
    const long = syntheticStats({ avgWordsPerSentence: 30, avgSyllablesPerWord: 1.5 });
    expect(fleschReadingEase.compute(short)).toBeGreaterThan(fleschReadingEase.compute(long));
  });
});

describe('Flesch Reading Ease — interpret() boundary values', () => {
  it('score ≥ 90 → very easy (5th grade)', () => {
    expect(fleschReadingEase.interpret(90).label).toBe('very easy');
    expect(fleschReadingEase.interpret(100).label).toBe('very easy');
    expect(fleschReadingEase.interpret(90).gradeLevel).toBe('5th grade');
  });

  it('score 80–89 → easy (6th grade)', () => {
    expect(fleschReadingEase.interpret(80).label).toBe('easy');
    expect(fleschReadingEase.interpret(89).label).toBe('easy');
    expect(fleschReadingEase.interpret(80).gradeLevel).toBe('6th grade');
  });

  it('score 70–79 → fairly easy (7th grade)', () => {
    expect(fleschReadingEase.interpret(70).label).toBe('fairly easy');
    expect(fleschReadingEase.interpret(79).label).toBe('fairly easy');
    expect(fleschReadingEase.interpret(70).gradeLevel).toBe('7th grade');
  });

  it('score 60–69 → standard (8th-9th grade)', () => {
    expect(fleschReadingEase.interpret(60).label).toBe('standard');
    expect(fleschReadingEase.interpret(69).label).toBe('standard');
    expect(fleschReadingEase.interpret(60).gradeLevel).toBe('8th-9th grade');
  });

  it('score 50–59 → fairly difficult (10th-12th grade)', () => {
    expect(fleschReadingEase.interpret(50).label).toBe('fairly difficult');
    expect(fleschReadingEase.interpret(59).label).toBe('fairly difficult');
    expect(fleschReadingEase.interpret(50).gradeLevel).toBe('10th-12th grade');
  });

  it('score 30–49 → difficult (college)', () => {
    expect(fleschReadingEase.interpret(30).label).toBe('difficult');
    expect(fleschReadingEase.interpret(49).label).toBe('difficult');
    expect(fleschReadingEase.interpret(30).gradeLevel).toBe('college');
  });

  it('score < 30 → very confusing (college graduate)', () => {
    expect(fleschReadingEase.interpret(29).label).toBe('very confusing');
    expect(fleschReadingEase.interpret(0).label).toBe('very confusing');
    expect(fleschReadingEase.interpret(-10).label).toBe('very confusing');
    expect(fleschReadingEase.interpret(0).gradeLevel).toBe('college graduate');
  });

  it('score is echoed in interpretation', () => {
    expect(fleschReadingEase.interpret(65).score).toBe(65);
  });
});

describe('Flesch Reading Ease — metadata', () => {
  it('has correct id and language', () => {
    expect(fleschReadingEase.id).toBe('flesch-reading-ease');
    expect(fleschReadingEase.language).toBe('en');
  });

  it('references Wikipedia Flesch-Kincaid', () => {
    expect(fleschReadingEase.reference).toContain('wikipedia.org');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  FLESCH-KINCAID GRADE LEVEL (1975)                                        ║
// ║  Formula: 0.39·W + 11.8·S − 15.59                                        ║
// ║  @see Kincaid, J.P. et al. (1975). Derivation of new readability         ║
// ║       formulas. CNTECHTRA Research Branch Report 8-75.                    ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Flesch-Kincaid Grade — compute()', () => {
  it('formula: 0.39·W + 11.8·S − 15.59 with W=15, S=1.5', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 15, avgSyllablesPerWord: 1.5 });
    // 5.85 + 17.7 − 15.59 = 7.96
    expect(round2(fleschKincaidGrade.compute(stats))).toBe(7.96);
  });

  it('formula with W=10, S=1.2 (elementary text)', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 10, avgSyllablesPerWord: 1.2 });
    // 3.9 + 14.16 − 15.59 = 2.47
    expect(round2(fleschKincaidGrade.compute(stats))).toBe(2.47);
  });

  it('formula with W=25, S=2.5 (college text)', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 25, avgSyllablesPerWord: 2.5 });
    // 9.75 + 29.5 − 15.59 = 23.66
    expect(round2(fleschKincaidGrade.compute(stats))).toBe(23.66);
  });

  it('formula with W=0, S=0 returns −15.59', () => {
    const stats = syntheticStats({ avgWordsPerSentence: 0, avgSyllablesPerWord: 0 });
    expect(round2(fleschKincaidGrade.compute(stats))).toBe(-15.59);
  });

  it('grade increases as syllables per word increase', () => {
    const low = syntheticStats({ avgWordsPerSentence: 15, avgSyllablesPerWord: 1.2 });
    const high = syntheticStats({ avgWordsPerSentence: 15, avgSyllablesPerWord: 2.5 });
    expect(fleschKincaidGrade.compute(high)).toBeGreaterThan(fleschKincaidGrade.compute(low));
  });

  it('grade increases as sentence length increases', () => {
    const short = syntheticStats({ avgWordsPerSentence: 10, avgSyllablesPerWord: 1.5 });
    const long = syntheticStats({ avgWordsPerSentence: 25, avgSyllablesPerWord: 1.5 });
    expect(fleschKincaidGrade.compute(long)).toBeGreaterThan(fleschKincaidGrade.compute(short));
  });
});

describe('Flesch-Kincaid Grade — interpret() boundary values', () => {
  it('rounded ≤ 5 → elementary', () => {
    expect(fleschKincaidGrade.interpret(3).label).toBe('elementary');
    expect(fleschKincaidGrade.interpret(5).label).toBe('elementary');
  });

  it('rounded 5.1–8 → middle school', () => {
    expect(fleschKincaidGrade.interpret(6).label).toBe('middle school');
    expect(fleschKincaidGrade.interpret(8).label).toBe('middle school');
  });

  it('rounded 8.1–12 → high school', () => {
    expect(fleschKincaidGrade.interpret(9).label).toBe('high school');
    expect(fleschKincaidGrade.interpret(12).label).toBe('high school');
  });

  it('rounded > 12 → college level', () => {
    expect(fleschKincaidGrade.interpret(13).label).toBe('college level');
    expect(fleschKincaidGrade.interpret(20).label).toBe('college level');
  });

  it('rounding affects boundary: 5.04 rounds to 5.0 → elementary', () => {
    expect(fleschKincaidGrade.interpret(5.04).label).toBe('elementary');
  });

  it('rounding affects boundary: 5.05 rounds to 5.1 → middle school', () => {
    expect(fleschKincaidGrade.interpret(5.05).label).toBe('middle school');
  });

  it('gradeLevel includes the rounded score', () => {
    expect(fleschKincaidGrade.interpret(7).gradeLevel).toBe('grade 7');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  GUNNING FOG INDEX (1952)                                                 ║
// ║  Formula: 0.4 · (W + 100 · (polysyllabic / words))                       ║
// ║  @see Gunning, R. (1952). The Technique of Clear Writing. McGraw-Hill.    ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Gunning Fog — compute()', () => {
  it('formula: 0.4·(W + 100·(poly/words)) with W=15, poly=10, words=100', () => {
    const stats = syntheticStats({
      avgWordsPerSentence: 15,
      polysyllabicWords: 10,
      words: 100,
    });
    // 0.4 · (15 + 100·0.1) = 0.4·25 = 10
    expect(round2(gunningFog.compute(stats))).toBe(10);
  });

  it('formula with W=8, poly=3, words=100 (easy text)', () => {
    const stats = syntheticStats({
      avgWordsPerSentence: 8,
      polysyllabicWords: 3,
      words: 100,
    });
    // 0.4 · (8 + 3) = 0.4·11 = 4.4
    expect(round2(gunningFog.compute(stats))).toBe(4.4);
  });

  it('formula with W=25, poly=30, words=100 (post-graduate text)', () => {
    const stats = syntheticStats({
      avgWordsPerSentence: 25,
      polysyllabicWords: 30,
      words: 100,
    });
    // 0.4 · (25 + 30) = 0.4·55 = 22
    expect(round2(gunningFog.compute(stats))).toBe(22);
  });

  it('returns 0 when words = 0 (edge case)', () => {
    const stats = syntheticStats({ words: 0, avgWordsPerSentence: 0, polysyllabicWords: 0 });
    expect(gunningFog.compute(stats)).toBe(0);
  });

  it('index increases as polysyllabic proportion increases', () => {
    const low = syntheticStats({ avgWordsPerSentence: 15, polysyllabicWords: 5, words: 100 });
    const high = syntheticStats({ avgWordsPerSentence: 15, polysyllabicWords: 25, words: 100 });
    expect(gunningFog.compute(high)).toBeGreaterThan(gunningFog.compute(low));
  });

  it('index increases as sentence length increases', () => {
    const short = syntheticStats({ avgWordsPerSentence: 10, polysyllabicWords: 10, words: 100 });
    const long = syntheticStats({ avgWordsPerSentence: 20, polysyllabicWords: 10, words: 100 });
    expect(gunningFog.compute(long)).toBeGreaterThan(gunningFog.compute(short));
  });
});

describe('Gunning Fog — interpret() boundary values', () => {
  it('rounded ≤ 6 → easy (6th grade)', () => {
    expect(gunningFog.interpret(5).label).toBe('easy');
    expect(gunningFog.interpret(6).label).toBe('easy');
    expect(gunningFog.interpret(6).gradeLevel).toBe('6th grade');
  });

  it('rounded 6.1–8 → medium (middle school)', () => {
    expect(gunningFog.interpret(7).label).toBe('medium');
    expect(gunningFog.interpret(8).label).toBe('medium');
    expect(gunningFog.interpret(7).gradeLevel).toBe('middle school');
  });

  it('rounded 8.1–12 → hard (high school)', () => {
    expect(gunningFog.interpret(9).label).toBe('hard');
    expect(gunningFog.interpret(12).label).toBe('hard');
    expect(gunningFog.interpret(10).gradeLevel).toBe('high school');
  });

  it('rounded 12.1–16 → very hard (college)', () => {
    expect(gunningFog.interpret(13).label).toBe('very hard');
    expect(gunningFog.interpret(16).label).toBe('very hard');
    expect(gunningFog.interpret(14).gradeLevel).toBe('college');
  });

  it('rounded > 16 → extremely hard (post-graduate)', () => {
    expect(gunningFog.interpret(17).label).toBe('extremely hard');
    expect(gunningFog.interpret(22).label).toBe('extremely hard');
    expect(gunningFog.interpret(20).gradeLevel).toBe('post-graduate');
  });

  it('rounding affects boundary: 6.04 rounds to 6.0 → easy', () => {
    expect(gunningFog.interpret(6.04).label).toBe('easy');
  });

  it('rounding affects boundary: 6.05 rounds to 6.1 → medium', () => {
    expect(gunningFog.interpret(6.05).label).toBe('medium');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  SMOG INDEX (1969)                                                        ║
// ║  Formula: 1.043·√(poly · 30/sentences) + 3.1291                          ║
// ║  @see McLaughlin, G.H. (1969). SMOG grading — a new readability formula. ║
// ║       Journal of Reading 22:639-646.                                      ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('SMOG — compute()', () => {
  it('formula: 1.043·√(poly·30/sentences) + 3.1291 with poly=20, sentences=10', () => {
    const stats = syntheticStats({ polysyllabicWords: 20, sentences: 10 });
    // 1.043·√60 + 3.1291 = 1.043·7.7459... + 3.1291 ≈ 11.21
    expect(round2(smog.compute(stats))).toBe(11.21);
  });

  it('formula with poly=5, sentences=10 (easier text)', () => {
    const stats = syntheticStats({ polysyllabicWords: 5, sentences: 10 });
    // 1.043·√15 + 3.1291 = 1.043·3.8729... + 3.1291 ≈ 7.17
    expect(round2(smog.compute(stats))).toBe(7.17);
  });

  it('formula with poly=40, sentences=5 (very hard text)', () => {
    const stats = syntheticStats({ polysyllabicWords: 40, sentences: 5 });
    // 1.043·√240 + 3.1291 = 1.043·15.4919... + 3.1291 ≈ 19.29
    expect(round2(smog.compute(stats))).toBe(19.29);
  });

  it('returns 0 when sentences = 0 (edge case)', () => {
    const stats = syntheticStats({ polysyllabicWords: 10, sentences: 0 });
    expect(smog.compute(stats)).toBe(0);
  });

  it('returns base 3.1291 when polysyllabic = 0', () => {
    const stats = syntheticStats({ polysyllabicWords: 0, sentences: 10 });
    // 1.043·√0 + 3.1291 = 3.1291
    expect(round2(smog.compute(stats))).toBe(3.13);
  });

  it('grade increases as polysyllabic count increases', () => {
    const low = syntheticStats({ polysyllabicWords: 5, sentences: 10 });
    const high = syntheticStats({ polysyllabicWords: 30, sentences: 10 });
    expect(smog.compute(high)).toBeGreaterThan(smog.compute(low));
  });

  it('grade increases as sentences decrease (denser polysyllabic ratio)', () => {
    const many = syntheticStats({ polysyllabicWords: 20, sentences: 20 });
    const few = syntheticStats({ polysyllabicWords: 20, sentences: 5 });
    expect(smog.compute(few)).toBeGreaterThan(smog.compute(many));
  });
});

describe('SMOG — interpret() boundary values', () => {
  it('rounded ≤ 6 → easy (6th grade)', () => {
    expect(smog.interpret(5).label).toBe('easy');
    expect(smog.interpret(6).label).toBe('easy');
    expect(smog.interpret(6).gradeLevel).toBe('6th grade');
  });

  it('rounded 6.1–9 → moderate (middle school)', () => {
    expect(smog.interpret(7).label).toBe('moderate');
    expect(smog.interpret(9).label).toBe('moderate');
    expect(smog.interpret(8).gradeLevel).toBe('middle school');
  });

  it('rounded 9.1–12 → hard (high school)', () => {
    expect(smog.interpret(10).label).toBe('hard');
    expect(smog.interpret(12).label).toBe('hard');
    expect(smog.interpret(10).gradeLevel).toBe('high school');
  });

  it('rounded > 12 → very hard (college)', () => {
    expect(smog.interpret(13).label).toBe('very hard');
    expect(smog.interpret(19).label).toBe('very hard');
    expect(smog.interpret(15).gradeLevel).toBe('college');
  });

  it('rounding affects boundary: 6.04 rounds to 6.0 → easy', () => {
    expect(smog.interpret(6.04).label).toBe('easy');
  });

  it('rounding affects boundary: 6.05 rounds to 6.1 → moderate', () => {
    expect(smog.interpret(6.05).label).toBe('moderate');
  });
});

describe('SMOG — metadata', () => {
  it('description mentions healthcare recommendation', () => {
    expect(smog.description.toLowerCase()).toContain('healthcare');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  COLEMAN-LIAU INDEX (1975)                                                ║
// ║  Formula: 0.0588·L100 − 0.296·S100 − 15.8                               ║
// ║    L100 = (letters/words)·100                                             ║
// ║    S100 = sentencesPerHundredWords                                        ║
// ║  @see Coleman, M. and Liau, T. (1975). A computer readability formula     ║
// ║       designed for machine scoring.                                       ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Coleman-Liau — compute()', () => {
  it('formula: 0.0588·L100 − 0.296·S100 − 15.8 with letters=450, words=100, S100=5', () => {
    const stats = syntheticStats({ letters: 450, words: 100, sentencesPerHundredWords: 5 });
    // L100 = 450; 0.0588·450 − 0.296·5 − 15.8 = 26.46 − 1.48 − 15.8 = 9.18
    expect(round2(colemanLiau.compute(stats))).toBe(9.18);
  });

  it('formula with letters=350, words=100, S100=10 (easy text)', () => {
    const stats = syntheticStats({ letters: 350, words: 100, sentencesPerHundredWords: 10 });
    // L100 = 350; 0.0588·350 − 0.296·10 − 15.8 = 20.58 − 2.96 − 15.8 = 1.82
    expect(round2(colemanLiau.compute(stats))).toBe(1.82);
  });

  it('formula with letters=500, words=100, S100=3 (difficult text)', () => {
    const stats = syntheticStats({ letters: 500, words: 100, sentencesPerHundredWords: 3 });
    // L100 = 500; 0.0588·500 − 0.296·3 − 15.8 = 29.4 − 0.888 − 15.8 = 12.712
    expect(round2(colemanLiau.compute(stats))).toBe(12.71);
  });

  it('grade increases as letter density increases', () => {
    const low = syntheticStats({ letters: 350, words: 100, sentencesPerHundredWords: 5 });
    const high = syntheticStats({ letters: 500, words: 100, sentencesPerHundredWords: 5 });
    expect(colemanLiau.compute(high)).toBeGreaterThan(colemanLiau.compute(low));
  });

  it('grade decreases as sentence frequency increases', () => {
    const few = syntheticStats({ letters: 400, words: 100, sentencesPerHundredWords: 3 });
    const many = syntheticStats({ letters: 400, words: 100, sentencesPerHundredWords: 12 });
    expect(colemanLiau.compute(few)).toBeGreaterThan(colemanLiau.compute(many));
  });

  it('uses character count instead of syllables', () => {
    const a = syntheticStats({
      letters: 400,
      words: 100,
      sentencesPerHundredWords: 5,
      avgSyllablesPerWord: 1,
    });
    const b = syntheticStats({
      letters: 400,
      words: 100,
      sentencesPerHundredWords: 5,
      avgSyllablesPerWord: 3,
    });
    expect(colemanLiau.compute(a)).toBe(colemanLiau.compute(b));
  });
});

describe('Coleman-Liau — interpret() boundary values', () => {
  it('rounded ≤ 5 → elementary', () => {
    expect(colemanLiau.interpret(3).label).toBe('elementary');
    expect(colemanLiau.interpret(5).label).toBe('elementary');
  });

  it('rounded 5.1–8 → middle school', () => {
    expect(colemanLiau.interpret(6).label).toBe('middle school');
    expect(colemanLiau.interpret(8).label).toBe('middle school');
  });

  it('rounded 8.1–12 → high school', () => {
    expect(colemanLiau.interpret(9).label).toBe('high school');
    expect(colemanLiau.interpret(12).label).toBe('high school');
  });

  it('rounded > 12 → college level', () => {
    expect(colemanLiau.interpret(13).label).toBe('college level');
    expect(colemanLiau.interpret(18).label).toBe('college level');
  });

  it('rounding affects boundary: 5.04 → elementary, 5.05 → middle school', () => {
    expect(colemanLiau.interpret(5.04).label).toBe('elementary');
    expect(colemanLiau.interpret(5.05).label).toBe('middle school');
  });

  it('gradeLevel contains the rounded score', () => {
    expect(colemanLiau.interpret(7.3).gradeLevel).toBe('grade 7.3');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  AUTOMATED READABILITY INDEX — ARI (1967)                                 ║
// ║  Formula: 4.71·(letters/words) + 0.5·W − 21.43                           ║
// ║  @see Smith, E.A. and Senter, R.J. (1967). Automated Readability Index.  ║
// ║       AMRL-TR-66-220.                                                     ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('ARI — compute()', () => {
  it('formula: 4.71·(letters/words) + 0.5·W − 21.43 with letters=500, words=100, W=20', () => {
    const stats = syntheticStats({ letters: 500, words: 100, avgWordsPerSentence: 20 });
    // 4.71·5 + 0.5·20 − 21.43 = 23.55 + 10 − 21.43 = 12.12
    expect(round2(automatedReadability.compute(stats))).toBe(12.12);
  });

  it('formula with letters=400, words=100, W=12 (standard text)', () => {
    const stats = syntheticStats({ letters: 400, words: 100, avgWordsPerSentence: 12 });
    // 4.71·4 + 0.5·12 − 21.43 = 18.84 + 6 − 21.43 = 3.41
    expect(round2(automatedReadability.compute(stats))).toBe(3.41);
  });

  it('formula with letters=600, words=100, W=30 (very difficult text)', () => {
    const stats = syntheticStats({ letters: 600, words: 100, avgWordsPerSentence: 30 });
    // 4.71·6 + 0.5·30 − 21.43 = 28.26 + 15 − 21.43 = 21.83
    expect(round2(automatedReadability.compute(stats))).toBe(21.83);
  });

  it('grade increases as letters per word increase', () => {
    const short = syntheticStats({ letters: 350, words: 100, avgWordsPerSentence: 15 });
    const long = syntheticStats({ letters: 550, words: 100, avgWordsPerSentence: 15 });
    expect(automatedReadability.compute(long)).toBeGreaterThan(automatedReadability.compute(short));
  });

  it('grade increases as sentence length increases', () => {
    const shortSent = syntheticStats({ letters: 400, words: 100, avgWordsPerSentence: 10 });
    const longSent = syntheticStats({ letters: 400, words: 100, avgWordsPerSentence: 25 });
    expect(automatedReadability.compute(longSent)).toBeGreaterThan(
      automatedReadability.compute(shortSent),
    );
  });

  it('does not use syllable counts', () => {
    const a = syntheticStats({
      letters: 400,
      words: 100,
      avgWordsPerSentence: 15,
      syllables: 100,
    });
    const b = syntheticStats({
      letters: 400,
      words: 100,
      avgWordsPerSentence: 15,
      syllables: 400,
    });
    expect(automatedReadability.compute(a)).toBe(automatedReadability.compute(b));
  });
});

describe('ARI — interpret() boundary values', () => {
  it('rounded ≤ 5 → elementary', () => {
    expect(automatedReadability.interpret(3).label).toBe('elementary');
    expect(automatedReadability.interpret(5).label).toBe('elementary');
  });

  it('rounded 5.1–8 → middle school', () => {
    expect(automatedReadability.interpret(6).label).toBe('middle school');
    expect(automatedReadability.interpret(8).label).toBe('middle school');
  });

  it('rounded 8.1–12 → high school', () => {
    expect(automatedReadability.interpret(9).label).toBe('high school');
    expect(automatedReadability.interpret(12).label).toBe('high school');
  });

  it('rounded > 12 → college level', () => {
    expect(automatedReadability.interpret(13).label).toBe('college level');
    expect(automatedReadability.interpret(20).label).toBe('college level');
  });

  it('rounding affects boundary: 8.04 → middle school, 8.05 → high school', () => {
    expect(automatedReadability.interpret(8.04).label).toBe('middle school');
    expect(automatedReadability.interpret(8.05).label).toBe('high school');
  });
});

describe('ARI — metadata', () => {
  it('description mentions character count', () => {
    expect(automatedReadability.description.toLowerCase()).toContain('character');
  });

  it('description mentions automated', () => {
    expect(automatedReadability.description.toLowerCase()).toContain('automated');
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  CROSS-FORMULA: easy text vs hard text (integration with real text)       ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('English formulas — easy vs hard real text integration', () => {
  const EASY =
    'The cat sat on the mat. The dog ran fast. I like to play. The sun is hot. We go home.';
  const HARD =
    'The epistemological ramifications of poststructuralist deconstructionism fundamentally undermine the presuppositional axioms upon which contemporary hermeneutical phenomenology predicates its methodological frameworks.';

  it('Flesch Reading Ease scores the easy text higher', () => {
    const easyStats = computeTextStats(EASY, 'en');
    const hardStats = computeTextStats(HARD, 'en');
    expect(fleschReadingEase.compute(easyStats)).toBeGreaterThan(
      fleschReadingEase.compute(hardStats),
    );
  });

  it('all grade-level formulas return lower values for easy text', () => {
    const easyStats = computeTextStats(EASY, 'en');
    const hardStats = computeTextStats(HARD, 'en');

    expect(fleschKincaidGrade.compute(easyStats)).toBeLessThan(
      fleschKincaidGrade.compute(hardStats),
    );
    expect(gunningFog.compute(easyStats)).toBeLessThan(gunningFog.compute(hardStats));
    expect(colemanLiau.compute(easyStats)).toBeLessThan(colemanLiau.compute(hardStats));
    expect(automatedReadability.compute(easyStats)).toBeLessThan(
      automatedReadability.compute(hardStats),
    );
  });

  it('easy text classified as easy/very easy by Flesch', () => {
    const stats = computeTextStats(EASY, 'en');
    const score = fleschReadingEase.compute(stats);
    const interp = fleschReadingEase.interpret(score);
    expect(['very easy', 'easy', 'fairly easy']).toContain(interp.label);
  });

  it('hard text classified as difficult/very confusing by Flesch', () => {
    const stats = computeTextStats(HARD, 'en');
    const score = fleschReadingEase.compute(stats);
    const interp = fleschReadingEase.interpret(score);
    expect(['difficult', 'very confusing', 'fairly difficult']).toContain(interp.label);
  });

  it('Flesch-Kincaid and ARI agree on difficulty direction', () => {
    const easyStats = computeTextStats(EASY, 'en');
    const hardStats = computeTextStats(HARD, 'en');
    const fkEasy = fleschKincaidGrade.compute(easyStats);
    const fkHard = fleschKincaidGrade.compute(hardStats);
    const ariEasy = automatedReadability.compute(easyStats);
    const ariHard = automatedReadability.compute(hardStats);
    expect(Math.sign(fkHard - fkEasy)).toBe(Math.sign(ariHard - ariEasy));
  });
});

// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║  REGISTRY — English formulas                                              ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

describe('Formula registry — English', () => {
  it('returns exactly 6 formulas for English', () => {
    expect(getFormulasForLanguage('en')).toHaveLength(6);
  });

  it('contains all expected formula IDs', () => {
    const ids = getFormulaIds('en');
    const expected = [
      'flesch-reading-ease',
      'flesch-kincaid-grade',
      'gunning-fog',
      'smog',
      'coleman-liau',
      'automated-readability',
    ];
    for (const id of expected) {
      expect(ids).toContain(id);
    }
  });

  it('getFormulaById finds each formula', () => {
    for (const id of getFormulaIds('en')) {
      const formula = getFormulaById(id, 'en');
      expect(formula).toBeDefined();
      expect(formula?.id).toBe(id);
    }
  });

  it('all English formulas have language "en"', () => {
    for (const f of getFormulasForLanguage('en')) {
      expect(f.language).toBe('en');
    }
  });

  it('all English formulas have a valid reference URL', () => {
    for (const f of getFormulasForLanguage('en')) {
      expect(f.reference).toMatch(/^https?:\/\//);
    }
  });

  it('all English formulas have a non-empty description', () => {
    for (const f of getFormulasForLanguage('en')) {
      expect(f.description.length).toBeGreaterThan(10);
    }
  });

  it('total formula count is 13 (7 ES + 6 EN)', () => {
    expect(getFormulasForLanguage('es').length + getFormulasForLanguage('en').length).toBe(13);
  });

  it('getFormulaById returns undefined for unknown id', () => {
    expect(getFormulaById('nonexistent', 'en')).toBeUndefined();
  });
});
