import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolModule } from '@weaaare/mcp-auditor-core';
import { result } from '@weaaare/mcp-auditor-core';
import type { VirtualScreenReaderAdapter } from './virtual.adapter.js';

const PERFORM_COMMAND_NAMES = [
  'findNextHeading',
  'findPreviousHeading',
  'findNextLink',
  'findPreviousLink',
  'findNextControl',
  'findPreviousControl',
  'moveToNextHeading',
  'moveToPreviousHeading',
  'moveToNextHeadingLevel1',
  'moveToPreviousHeadingLevel1',
  'moveToNextHeadingLevel2',
  'moveToPreviousHeadingLevel2',
  'moveToNextHeadingLevel3',
  'moveToPreviousHeadingLevel3',
  'moveToNextHeadingLevel4',
  'moveToPreviousHeadingLevel4',
  'moveToNextHeadingLevel5',
  'moveToPreviousHeadingLevel5',
  'moveToNextHeadingLevel6',
  'moveToPreviousHeadingLevel6',
  'moveToNextLink',
  'moveToPreviousLink',
  'moveToNextLandmark',
  'moveToPreviousLandmark',
  'moveToNextBanner',
  'moveToPreviousBanner',
  'moveToNextNavigation',
  'moveToPreviousNavigation',
  'moveToNextMain',
  'moveToPreviousMain',
  'moveToNextRegion',
  'moveToPreviousRegion',
  'moveToNextContentinfo',
  'moveToPreviousContentinfo',
  'moveToNextComplementary',
  'moveToPreviousComplementary',
  'moveToNextSearch',
  'moveToPreviousSearch',
  'moveToNextForm',
  'moveToPreviousForm',
  'moveToNextFigure',
  'moveToPreviousFigure',
  'jumpToControlledElement',
  'jumpToDetailsElement',
  'jumpToErrorMessageElement',
] as const;

const defineTools = (): Tool[] => [
  {
    name: 'virtual_start',
    description: [
      'Start the Virtual Screen Reader on a live web page or provided HTML content.',
      'This launches a real browser (headless), navigates to the URL or loads the HTML,',
      'and injects a virtual screen reader that navigates the live accessibility tree.',
      'JavaScript on the page executes normally, so SPAs and dynamic content work.',
      '',
      "Provide either 'url' (preferred) or 'html'. If both are given, 'url' takes priority.",
      '',
      'Typical workflow:',
      '1. Call virtual_start with the URL to audit',
      '2. Navigate with virtual_next, virtual_previous, virtual_perform, etc.',
      '3. Call virtual_stop when done',
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description:
            'URL to audit. A real browser navigates to this URL, so JS executes and dynamic content renders.',
        },
        html: {
          type: 'string',
          description: 'Raw HTML content to audit. Used as fallback when no URL is provided.',
        },
      },
    },
  },
  {
    name: 'virtual_stop',
    description: 'Stop the Virtual Screen Reader and release resources.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_next',
    description:
      'Move the Virtual Screen Reader cursor to the next item in the accessibility tree.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_previous',
    description:
      'Move the Virtual Screen Reader cursor to the previous item in the accessibility tree.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_act',
    description:
      'Perform the default action for the current item (e.g., activate a link or button).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_interact',
    description:
      'Interact with the current item. Note: this is a no-op in the Virtual Screen Reader.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_stop_interacting',
    description:
      'Stop interacting with the current item. Note: this is a no-op in the Virtual Screen Reader.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_press',
    description:
      "Press a key on the focused item (e.g., 'Enter', 'Tab', 'ArrowDown', 'Command+f').",
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: "Key to press (e.g., 'Enter', 'Tab', 'ArrowDown', 'Shift+Tab')",
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'virtual_type',
    description: 'Type text into the focused item.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Text to type' } },
      required: ['text'],
    },
  },
  {
    name: 'virtual_perform',
    description: [
      'Perform a navigation command in the Virtual Screen Reader.',
      'Supports semantic navigation by element type: headings (by level), links, landmarks, forms, figures, and ARIA relationships.',
      '',
      'Common compatible commands: findNextHeading, findPreviousHeading, findNextLink, findPreviousLink, findNextControl, findPreviousControl.',
      '',
      'Virtual-specific commands: moveToNextHeadingLevel1-6, moveToNextLandmark, moveToNextBanner, moveToNextNavigation, moveToNextMain, moveToNextRegion, etc.',
    ].join('\n'),
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: [...PERFORM_COMMAND_NAMES],
          description: 'Navigation command to perform',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'virtual_item_text',
    description: 'Get the text of the item currently under the Virtual Screen Reader cursor.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_last_spoken_phrase',
    description: 'Get the last phrase spoken by the Virtual Screen Reader.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_spoken_phrase_log',
    description: 'Get the log of all spoken phrases for this Virtual Screen Reader session.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_item_text_log',
    description: 'Get the log of all visited item text for this Virtual Screen Reader session.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_clear_spoken_phrase_log',
    description: 'Clear the log of all spoken phrases.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_clear_item_text_log',
    description: 'Clear the log of all visited item text.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'virtual_click',
    description: 'Click the mouse at the current position.',
    inputSchema: {
      type: 'object',
      properties: {
        button: {
          type: 'string',
          enum: ['left', 'right'],
          description: 'Mouse button to click (default: left)',
        },
        clickCount: { type: 'number', description: 'Number of times to click (default: 1)' },
      },
    },
  },
];

const buildHandlers = (adapter: VirtualScreenReaderAdapter): Map<string, ToolHandler> => {
  const handlers = new Map<string, ToolHandler>();

  handlers.set('virtual_start', async (args) => {
    if (args.url) {
      await adapter.loadUrl(args.url as string);
    } else if (args.html) {
      await adapter.loadHtml(args.html as string);
    } else {
      throw new Error("Either 'url' or 'html' parameter is required");
    }
    const res = await adapter.start();
    return result.json(res);
  });

  handlers.set('virtual_stop', async () => {
    const res = await adapter.stop();
    return result.json(res);
  });
  handlers.set('virtual_next', async () => {
    const res = await adapter.next();
    return result.json(res);
  });
  handlers.set('virtual_previous', async () => {
    const res = await adapter.previous();
    return result.json(res);
  });
  handlers.set('virtual_act', async () => {
    const res = await adapter.act();
    return result.json(res);
  });
  handlers.set('virtual_interact', async () => {
    const res = await adapter.interact();
    return result.json(res);
  });
  handlers.set('virtual_stop_interacting', async () => {
    const res = await adapter.stopInteracting();
    return result.json(res);
  });

  handlers.set('virtual_press', async (args) => {
    if (!args.key) {
      throw new Error('key parameter is required');
    }
    const res = await adapter.press(args.key as string);
    return result.json(res);
  });

  handlers.set('virtual_type', async (args) => {
    if (!args.text) {
      throw new Error('text parameter is required');
    }
    const res = await adapter.type(args.text as string);
    return result.json(res);
  });

  handlers.set('virtual_perform', async (args) => {
    if (!args.command) {
      throw new Error('command parameter is required');
    }
    const res = await adapter.perform(args.command as string);
    return result.json(res);
  });

  handlers.set('virtual_item_text', async () => {
    const text = await adapter.itemText();
    return result.text(text);
  });
  handlers.set('virtual_last_spoken_phrase', async () => {
    const phrase = await adapter.lastSpokenPhrase();
    return result.text(phrase);
  });
  handlers.set('virtual_spoken_phrase_log', async () => {
    const log = await adapter.spokenPhraseLog();
    return result.json(log);
  });
  handlers.set('virtual_item_text_log', async () => {
    const log = await adapter.itemTextLog();
    return result.json(log);
  });
  handlers.set('virtual_clear_spoken_phrase_log', async () => {
    await adapter.clearSpokenPhraseLog();
    return result.text('Spoken phrase log cleared');
  });
  handlers.set('virtual_clear_item_text_log', async () => {
    await adapter.clearItemTextLog();
    return result.text('Item text log cleared');
  });

  handlers.set('virtual_click', async (args) => {
    const res = await adapter.click({
      button: (args.button as 'left' | 'right') ?? 'left',
      clickCount: (args.clickCount as number) ?? 1,
    });
    return result.json(res);
  });

  return handlers;
};

export const createVirtualTools = (adapter: VirtualScreenReaderAdapter): ToolModule => ({
  tools: defineTools(),
  handlers: buildHandlers(adapter),
});
