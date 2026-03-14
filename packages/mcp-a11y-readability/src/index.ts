#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  analyzeReadabilitySchema,
  executeAnalyzeReadability,
} from './tools/analyze-readability.js';
import {
  analyzeReadabilityFormulaSchema,
  executeAnalyzeReadabilityFormula,
} from './tools/analyze-readability-formula.js';
import { compareTextsSchema, executeCompareTexts } from './tools/compare-texts.js';
import { executeGetTextStats, getTextStatsSchema } from './tools/get-text-stats.js';
import { executeListFormulas, listFormulasSchema } from './tools/list-formulas.js';
import {
  executeSuggestReadabilityImprovements,
  suggestReadabilityImprovementsSchema,
} from './tools/suggest-readability-improvements.js';

const server = new McpServer({
  name: '@weaaare/mcp-a11y-readability',
  version: '0.0.1',
});

server.tool(
  'analyze-readability',
  'Analyze text readability using all formulas for the detected language. Returns scores, interpretation, and an overall consensus. Supports Spanish (Fernández Huerta, Szigriszt-Pazos, INFLESZ, Gutiérrez de Polini, Crawford, Legibilidad µ, García López) and English (Flesch Reading Ease, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau, ARI).',
  analyzeReadabilitySchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeAnalyzeReadability(input), null, 2) }],
  }),
);

server.tool(
  'analyze-readability-formula',
  'Analyze text readability using a specific formula. Use list-formulas to discover available formula IDs.',
  analyzeReadabilityFormulaSchema.shape,
  async (input) => ({
    content: [
      { type: 'text', text: JSON.stringify(executeAnalyzeReadabilityFormula(input), null, 2) },
    ],
  }),
);

server.tool(
  'get-text-stats',
  'Extract raw text statistics: sentence count, word count, syllable count, character count, average syllables per word, average words per sentence, polysyllabic words, and more.',
  getTextStatsSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeGetTextStats(input), null, 2) }],
  }),
);

server.tool(
  'list-formulas',
  'List all available readability formulas, optionally filtered by language. Returns formula ID, name, description, language, and reference URL.',
  listFormulasSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeListFormulas(input), null, 2) }],
  }),
);

server.tool(
  'suggest-readability-improvements',
  'Analyze text and suggest specific improvements to increase readability: shorter sentences, simpler words, reduced polysyllabic vocabulary.',
  suggestReadabilityImprovementsSchema.shape,
  async (input) => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify(executeSuggestReadabilityImprovements(input), null, 2),
      },
    ],
  }),
);

server.tool(
  'compare-texts',
  'Compare readability of two texts side by side. Returns formula scores, deltas, and consensus for each text.',
  compareTextsSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeCompareTexts(input), null, 2) }],
  }),
);

const main = async (): Promise<void> => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main().catch((error: unknown) => {
  console.error('Fatal error starting MCP server:', error);
  process.exit(1);
});
