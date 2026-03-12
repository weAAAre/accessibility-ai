import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolModule } from '@weaaare/mcp-auditor-core';
import { result } from '@weaaare/mcp-auditor-core';
import type { ApplicationManager } from './application-manager.js';
import type { FocusTracker } from './focus-tracker.js';

function defineTools(): Tool[] {
  return [
    {
      name: 'macos_activate_application',
      description:
        'Activate (bring to front) a macOS application by name. Useful for switching between IDE and browser.',
      inputSchema: {
        type: 'object',
        properties: {
          applicationName: {
            type: 'string',
            description:
              "Name of the application (e.g., 'Safari', 'Google Chrome', 'Visual Studio Code')",
          },
        },
        required: ['applicationName'],
      },
    },
    {
      name: 'macos_get_active_application',
      description: 'Get the name of the currently active (frontmost) macOS application.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'focus_ensure_browser',
      description:
        'Ensure the browser is the active application. Activates it if not already focused. Returns whether a switch was needed.',
      inputSchema: {
        type: 'object',
        properties: {
          browserName: {
            type: 'string',
            description: "Browser name (default: 'Google Chrome')",
          },
        },
      },
    },
    {
      name: 'focus_record',
      description:
        'Record the current focus position for recovery. Call this after important navigation steps.',
      inputSchema: {
        type: 'object',
        properties: {
          application: {
            type: 'string',
            description: 'Current application name',
          },
          url: {
            type: 'string',
            description: 'Current URL (if in browser)',
          },
          element: {
            type: 'string',
            description: 'Description of current element',
          },
          spokenPhrase: {
            type: 'string',
            description: 'Last spoken phrase by screen reader',
          },
        },
        required: ['application'],
      },
    },
    {
      name: 'focus_last_known',
      description:
        'Get the last known focus position. Use this to recover when focus is lost (e.g., after a notification).',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'focus_history',
      description: 'Get the full focus navigation history. Useful for debugging focus loss.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

function buildHandlers(
  appManager: ApplicationManager,
  focusTracker: FocusTracker,
): Map<string, ToolHandler> {
  const handlers = new Map<string, ToolHandler>();

  handlers.set('macos_activate_application', async (args) => {
    if (!args.applicationName) {
      throw new Error('applicationName parameter is required');
    }
    const appName = args.applicationName as string;
    await appManager.activateApplication(appName);
    return result.json({
      action: 'activated application',
      applicationName: appName,
      message: `Successfully activated ${appName}`,
    });
  });

  handlers.set('macos_get_active_application', async () => {
    const info = await appManager.getActiveApplication();
    return result.json({
      activeApplication: info.name,
      message: `Currently active application: ${info.name}`,
    });
  });

  handlers.set('focus_ensure_browser', async (args) => {
    const browserName = (args.browserName as string) ?? 'Google Chrome';
    const wasAlreadyFocused = await appManager.ensureBrowserFocused(browserName);
    return result.json({
      browserName,
      wasAlreadyFocused,
      message: wasAlreadyFocused
        ? `${browserName} was already focused`
        : `Switched to ${browserName}`,
    });
  });

  handlers.set('focus_record', async (args) => {
    if (!args.application) {
      throw new Error('application parameter is required');
    }
    focusTracker.record({
      application: args.application as string,
      url: args.url as string | undefined,
      element: args.element as string | undefined,
      spokenPhrase: args.spokenPhrase as string | undefined,
    });
    return result.json({
      action: 'focus position recorded',
      breadcrumb: focusTracker.lastKnown(),
    });
  });

  handlers.set('focus_last_known', async () => {
    const last = focusTracker.lastKnown();
    if (!last) {
      return result.json({
        message: 'No focus history recorded yet',
      });
    }
    return result.json(last);
  });

  handlers.set('focus_history', async () => {
    const history = focusTracker.history();
    return result.json({
      totalEntries: history.length,
      history,
    });
  });

  return handlers;
}

export function createNavigationTools(
  appManager: ApplicationManager,
  focusTracker: FocusTracker,
): ToolModule {
  return {
    tools: defineTools(),
    handlers: buildHandlers(appManager, focusTracker),
  };
}
