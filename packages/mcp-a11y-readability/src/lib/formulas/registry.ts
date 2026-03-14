import type { FormulaDefinition, Language } from '../../types.js';

import { automatedReadability } from './automated-readability.js';
import { colemanLiau } from './coleman-liau.js';
import { crawford } from './crawford.js';
import { fernandezHuerta } from './fernandez-huerta.js';
import { fleschKincaidGrade } from './flesch-kincaid-grade.js';
import { fleschReadingEase } from './flesch-reading-ease.js';
import { garciaLopez } from './garcia-lopez.js';
import { gunningFog } from './gunning-fog.js';
import { gutierrezPolini } from './gutierrez-polini.js';
import { legibilidadMu } from './legibilidad-mu.js';
import { smog } from './smog.js';
import { inflesz, szigrisztPazos } from './szigriszt-pazos.js';

const SPANISH_FORMULAS: FormulaDefinition[] = [
  fernandezHuerta,
  szigrisztPazos,
  inflesz,
  gutierrezPolini,
  crawford,
  legibilidadMu,
  garciaLopez,
];

const ENGLISH_FORMULAS: FormulaDefinition[] = [
  fleschReadingEase,
  fleschKincaidGrade,
  gunningFog,
  smog,
  colemanLiau,
  automatedReadability,
];

const FORMULA_MAP: Record<Language, FormulaDefinition[]> = {
  es: SPANISH_FORMULAS,
  en: ENGLISH_FORMULAS,
};

export const getFormulasForLanguage = (lang: Language): FormulaDefinition[] =>
  FORMULA_MAP[lang] ?? [];

export const getFormulaById = (id: string, lang: Language): FormulaDefinition | undefined =>
  getFormulasForLanguage(lang).find((f) => f.id === id);

export const getAllFormulas = (): FormulaDefinition[] => [...SPANISH_FORMULAS, ...ENGLISH_FORMULAS];

export const getFormulaIds = (lang: Language): string[] =>
  getFormulasForLanguage(lang).map((f) => f.id);
