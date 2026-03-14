import { z } from 'zod';

import { getAllFormulas, getFormulasForLanguage } from '../lib/formulas/registry.js';
import type { Language } from '../types.js';

export const listFormulasSchema = z.object({
  lang: z.enum(['es', 'en']).optional().describe('Filter by language. Omit to list all formulas.'),
});

export type ListFormulasInput = z.input<typeof listFormulasSchema>;

export const executeListFormulas = (input: ListFormulasInput) => {
  const formulas = input.lang ? getFormulasForLanguage(input.lang as Language) : getAllFormulas();

  return {
    count: formulas.length,
    formulas: formulas.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      language: f.language,
      reference: f.reference,
    })),
  };
};
