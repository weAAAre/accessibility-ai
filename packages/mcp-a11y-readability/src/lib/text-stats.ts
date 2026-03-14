import { getSyllables } from 'silabajs';
import { syllable } from 'syllable';

import type { Language, TextStats } from '../types.js';

const SENTENCE_SPLITTER_ES = /[.!?¡¿…]+/g;
const SENTENCE_SPLITTER_EN = /[.!?…]+/g;

const WORD_SPLITTER = /\s+/;

const countSentences = (text: string, lang: Language): number => {
  const splitter = lang === 'es' ? SENTENCE_SPLITTER_ES : SENTENCE_SPLITTER_EN;
  const matches = text.match(splitter);
  return Math.max(matches ? matches.length : 1, 1);
};

const extractWords = (text: string): string[] =>
  text
    .split(WORD_SPLITTER)
    .map((w) => w.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ''-]/g, ''))
    .filter((w) => w.length > 0);

const countSyllablesForWord = (word: string, lang: Language): number => {
  if (lang === 'es') {
    return getSyllables(word).syllableCount;
  }
  return Math.max(syllable(word), 1);
};

export const computeTextStats = (text: string, lang: Language): TextStats => {
  const trimmed = text.trim();
  const words = extractWords(trimmed);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
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
    };
  }

  const sentenceCount = countSentences(trimmed, lang);

  let totalSyllables = 0;
  let totalLetters = 0;
  let polysyllabicWords = 0;
  const letterCounts: number[] = [];

  for (const word of words) {
    const wordSyllables = countSyllablesForWord(word, lang);
    totalSyllables += wordSyllables;
    totalLetters += word.length;
    letterCounts.push(word.length);
    if (wordSyllables >= 3) {
      polysyllabicWords++;
    }
  }

  const avgLettersPerWord = totalLetters / wordCount;
  const letterVariance =
    letterCounts.reduce((sum, len) => sum + (len - avgLettersPerWord) ** 2, 0) / wordCount;

  return {
    sentences: sentenceCount,
    words: wordCount,
    syllables: totalSyllables,
    characters: trimmed.length,
    letters: totalLetters,
    avgSyllablesPerWord: totalSyllables / wordCount,
    avgWordsPerSentence: wordCount / sentenceCount,
    avgLettersPerWord,
    letterVariance,
    syllablesPerHundredWords: (totalSyllables / wordCount) * 100,
    sentencesPerHundredWords: (sentenceCount / wordCount) * 100,
    polysyllabicWords,
  };
};
