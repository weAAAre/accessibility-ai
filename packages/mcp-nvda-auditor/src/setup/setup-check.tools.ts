import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ScreenReaderPort, ToolHandler, ToolModule } from '@weaaare/mcp-auditor-core';
import { result } from '@weaaare/mcp-auditor-core';

function defineTools(): Tool[] {
  return [
    {
      name: 'check_setup',
      description:
        'Check if the NVDA environment is properly configured. Verifies Windows platform, NVDA support, and whether NVDA is the default screen reader. Run this before starting an audit.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

function buildHandlers(screenReader: ScreenReaderPort): Map<string, ToolHandler> {
  const handlers = new Map<string, ToolHandler>();

  handlers.set('check_setup', async () => {
    const checks: Record<string, unknown> = {};

    checks.platform = process.platform;
    checks.isWindows = process.platform === 'win32';

    if (!checks.isWindows) {
      checks.warning =
        'NVDA requires Windows. This server can run on other platforms for development purposes, but nvda_start will fail on non-Windows systems.';
    }

    try {
      checks.nvdaDetected = await screenReader.detect();
    } catch {
      checks.nvdaDetected = false;
      checks.nvdaDetectError = 'Could not detect NVDA (expected on non-Windows platforms)';
    }

    try {
      checks.nvdaIsDefault = await screenReader.isDefault();
    } catch {
      checks.nvdaIsDefault = false;
    }

    const ready = checks.isWindows === true && checks.nvdaDetected === true;

    return result.json({
      ready,
      checks,
      recommendation: ready
        ? 'Environment is ready. Call nvda_start to begin the audit.'
        : 'Environment is not ready. Ensure you are running on Windows with NVDA installed. Download NVDA at https://www.nvaccess.org/',
    });
  });

  return handlers;
}

export const createSetupTools = (screenReader: ScreenReaderPort): ToolModule => ({
  tools: defineTools(),
  handlers: buildHandlers(screenReader),
});
