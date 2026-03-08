#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  analyzeDesignTokensSchema,
  executeAnalyzeDesignTokens,
} from './tools/analyze-design-tokens.js';
import {
  analyzePaletteContrastSchema,
  executeAnalyzePaletteContrast,
} from './tools/analyze-palette-contrast.js';
import { apcaContrastSchema, executeApcaContrast } from './tools/apca-contrast.js';
import { checkContrastSchema, executeCheckContrast } from './tools/check-contrast.js';
import {
  executeFindAccessibleColor,
  findAccessibleColorSchema,
} from './tools/find-accessible-color.js';
import {
  executeGenerateCvdSafePalette,
  generateCvdSafePaletteSchema,
} from './tools/generate-cvd-safe-palette.js';
import { executeGetColorInfo, getColorInfoSchema } from './tools/get-color-info.js';
import { executeNearestColorName, nearestColorNameSchema } from './tools/nearest-color-name.js';
import {
  executeSimulateColorBlindness,
  simulateColorBlindnessSchema,
} from './tools/simulate-color-blindness.js';
import {
  executeSuggestContrastFix,
  suggestContrastFixSchema,
} from './tools/suggest-contrast-fix.js';

const server = new McpServer({
  name: '@weaaare/mcp-a11y-color',
  version: '0.0.1',
});

server.tool(
  'check-contrast',
  'Calculate WCAG 2.2 contrast ratio between foreground and background colors. Reports pass/fail for AA/AAA, normal/large text, and UI components.',
  checkContrastSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeCheckContrast(input), null, 2) }],
  }),
);

server.tool(
  'get-color-info',
  'Parse any CSS color and return hex, RGB, HSL, relative luminance, and contrast ratios against black and white.',
  getColorInfoSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeGetColorInfo(input), null, 2) }],
  }),
);

server.tool(
  'suggest-contrast-fix',
  'Given a foreground/background color pair that fails contrast, suggest the closest accessible alternative that meets the specified WCAG level.',
  suggestContrastFixSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeSuggestContrastFix(input), null, 2) }],
  }),
);

server.tool(
  'simulate-color-blindness',
  'Simulate how one or more colors appear to individuals with color vision deficiency (protanopia, deuteranopia, tritanopia, etc.). Reports Delta E distinguishability for color pairs.',
  simulateColorBlindnessSchema.shape,
  async (input) => ({
    content: [
      { type: 'text', text: JSON.stringify(executeSimulateColorBlindness(input), null, 2) },
    ],
  }),
);

server.tool(
  'find-accessible-color',
  'Given a background color and target contrast ratio, find colors at a specified hue that meet WCAG requirements.',
  findAccessibleColorSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeFindAccessibleColor(input), null, 2) }],
  }),
);

server.tool(
  'apca-contrast',
  'Calculate APCA Lc (Lightness Contrast) for WCAG 3.0. Returns the perceptual contrast score, polarity, and usage recommendation alongside the WCAG 2.x ratio for comparison.',
  apcaContrastSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeApcaContrast(input), null, 2) }],
  }),
);

server.tool(
  'nearest-color-name',
  'Find the closest CSS named color(s) for any color using perceptual Delta E distance. Useful for human-readable descriptions, alt text, and documentation.',
  nearestColorNameSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeNearestColorName(input), null, 2) }],
  }),
);

server.tool(
  'analyze-palette-contrast',
  'Analyze an N×N contrast matrix for a set of colors. Reports WCAG pass/fail for every foreground/background combination — essential for design system audits.',
  analyzePaletteContrastSchema.shape,
  async (input) => ({
    content: [
      { type: 'text', text: JSON.stringify(executeAnalyzePaletteContrast(input), null, 2) },
    ],
  }),
);

server.tool(
  'generate-cvd-safe-palette',
  'Generate a palette of N colors that remain distinguishable under all color vision deficiency types. Ideal for charts, maps, and status indicators.',
  generateCvdSafePaletteSchema.shape,
  async (input) => ({
    content: [
      { type: 'text', text: JSON.stringify(executeGenerateCvdSafePalette(input), null, 2) },
    ],
  }),
);

server.tool(
  'analyze-design-tokens',
  'Audit a set of design tokens (CSS variables, JSON tokens) for WCAG compliance. Automatically classifies tokens as text/background, checks all combinations, and suggests fixes for failures.',
  analyzeDesignTokensSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeAnalyzeDesignTokens(input), null, 2) }],
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
