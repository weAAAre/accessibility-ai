#!/usr/bin/env node

/**
 * @weAAAre/mcp-a11y-color
 *
 * MCP server for color accessibility — contrast checking, color blindness simulation,
 * palette analysis, and WCAG 2.2 compliance.
 *
 * @license MIT
 * @author weAAAre <hola@weAAAre.com>
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { checkContrastSchema, executeCheckContrast } from './tools/check-contrast.js';
import {
  executeFindAccessibleColor,
  findAccessibleColorSchema,
} from './tools/find-accessible-color.js';
import { executeGetColorInfo, getColorInfoSchema } from './tools/get-color-info.js';
import {
  executeSimulateColorBlindness,
  simulateColorBlindnessSchema,
} from './tools/simulate-color-blindness.js';
import {
  executeSuggestContrastFix,
  suggestContrastFixSchema,
} from './tools/suggest-contrast-fix.js';

const server = new McpServer({
  name: '@weAAAre/mcp-a11y-color',
  version: '0.0.1',
});

// ─── Tool: check-contrast ────────────────────────────────────────────────────

server.tool(
  'check-contrast',
  'Calculate WCAG 2.2 contrast ratio between foreground and background colors. Reports pass/fail for AA/AAA, normal/large text, and UI components.',
  checkContrastSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeCheckContrast(input), null, 2) }],
  }),
);

// ─── Tool: get-color-info ────────────────────────────────────────────────────

server.tool(
  'get-color-info',
  'Parse any CSS color and return hex, RGB, HSL, relative luminance, and contrast ratios against black and white.',
  getColorInfoSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeGetColorInfo(input), null, 2) }],
  }),
);

// ─── Tool: suggest-contrast-fix ──────────────────────────────────────────────

server.tool(
  'suggest-contrast-fix',
  'Given a foreground/background color pair that fails contrast, suggest the closest accessible alternative that meets the specified WCAG level.',
  suggestContrastFixSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeSuggestContrastFix(input), null, 2) }],
  }),
);

// ─── Tool: simulate-color-blindness ──────────────────────────────────────────

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

// ─── Tool: find-accessible-color ─────────────────────────────────────────────

server.tool(
  'find-accessible-color',
  'Given a background color and target contrast ratio, find colors at a specified hue that meet WCAG requirements.',
  findAccessibleColorSchema.shape,
  async (input) => ({
    content: [{ type: 'text', text: JSON.stringify(executeFindAccessibleColor(input), null, 2) }],
  }),
);

// ─── Start server ────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error starting MCP server:', error);
  process.exit(1);
});
