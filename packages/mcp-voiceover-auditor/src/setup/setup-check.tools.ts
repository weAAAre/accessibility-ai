import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ScreenReaderPort, ToolHandler, ToolModule } from '@weaaare/mcp-auditor-core';
import { result } from '@weaaare/mcp-auditor-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadAppleScript(scriptName: string): string {
  const scriptPath = join(__dirname, 'utils', scriptName);
  return readFileSync(scriptPath, 'utf-8');
}

function defineTools(): Tool[] {
  return [
    {
      name: 'check_setup',
      description:
        'Check if the screen reader environment is properly configured. Run this before starting an audit to verify VoiceOver AppleScript access, permissions, and OS compatibility.',
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

    // Check screen reader support
    try {
      checks.screenReaderSupported = await screenReader.detect();
    } catch {
      checks.screenReaderSupported = false;
    }

    // Check default screen reader
    try {
      checks.isDefaultScreenReader = await screenReader.isDefault();
    } catch {
      checks.isDefaultScreenReader = false;
    }

    // Check AppleScript enabled (macOS only)
    // Retry up to a few times because VoiceOver may still be initializing
    // after voiceover_start returns (race condition).
    let appleScriptEnabled = false;
    const verifyScript = loadAppleScript('verify-voiceover-applescript.applescript');
    const escapedScript = verifyScript.replace(/'/g, "'\\\\''");
    const maxAttempts = 5;
    const delayMs = 1000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const output = execSync(`osascript -e '${escapedScript}' 2>/dev/null`, {
          encoding: 'utf-8',
        }).trim();
        if (output === 'true') {
          appleScriptEnabled = true;
          break;
        }
      } catch {
        // VoiceOver not ready yet
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    checks.appleScriptEnabled = appleScriptEnabled;

    // Check OS version
    let osVersion = 'unknown';
    try {
      osVersion = execSync('sw_vers -productVersion', {
        encoding: 'utf-8',
      }).trim();
    } catch {
      // Not macOS
    }
    checks.osVersion = osVersion;

    // Determine readiness
    const isReady = checks.screenReaderSupported && checks.appleScriptEnabled;
    checks.ready = isReady;

    if (!isReady) {
      checks.setupInstructions = [];
      if (!checks.screenReaderSupported) {
        (checks.setupInstructions as string[]).push(
          'VoiceOver is not detected. This tool requires macOS with VoiceOver.',
        );
      }
      if (!checks.appleScriptEnabled) {
        (checks.setupInstructions as string[]).push(
          'AppleScript is not enabled for VoiceOver. Enable it in: VoiceOver Utility → General → Allow VoiceOver to be controlled with AppleScript',
        );
        (checks.setupInstructions as string[]).push('Alternatively, run: npx @guidepup/setup');
        (checks.setupInstructions as string[]).push(
          'Note: @guidepup/setup does NOT support macOS Sequoia (15) or Tahoe (16) yet. Manual setup required for those versions.',
        );
      }
    }

    return result.json(checks);
  });

  return handlers;
}

export function createSetupTools(screenReader: ScreenReaderPort): ToolModule {
  return {
    tools: defineTools(),
    handlers: buildHandlers(screenReader),
  };
}
