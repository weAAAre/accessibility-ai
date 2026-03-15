import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ScreenReaderPort, ToolHandler, ToolModule } from '@weaaare/mcp-auditor-core';
import { result } from '@weaaare/mcp-auditor-core';

const PERFORM_COMMAND_NAMES = [
  // Basic navigation
  'moveToNext',
  'moveToPrevious',
  'readNextFocusableItem',
  'performDefaultActionForItem',
  'activate',
  // Headings
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
  // Links
  'moveToNextLink',
  'moveToPreviousLink',
  'moveToNextUnvisitedLink',
  'moveToPreviousUnvisitedLink',
  'moveToNextVisitedLink',
  'moveToPreviousVisitedLink',
  // Forms
  'moveToNextFormField',
  'moveToPreviousFormField',
  'moveToNextButton',
  'moveToPreviousButton',
  'moveToNextCheckbox',
  'moveToPreviousCheckbox',
  'moveToNextComboBox',
  'moveToPreviousComboBox',
  'moveToNextRadioButton',
  'moveToPreviousRadioButton',
  'moveToNextEditField',
  'moveToPreviousEditField',
  // Landmarks
  'moveToNextLandmark',
  'moveToPreviousLandmark',
  // Tables
  'moveToNextTable',
  'moveToPreviousTable',
  'moveToNextColumn',
  'moveToPreviousColumn',
  'moveToNextRow',
  'moveToPreviousRow',
  // Lists
  'moveToNextList',
  'moveToPreviousList',
  'moveToNextListItem',
  'moveToPreviousListItem',
  // Other browse mode elements
  'moveToNextGraphic',
  'moveToPreviousGraphic',
  'moveToNextBlockQuote',
  'moveToPreviousBlockQuote',
  'moveToNextNonLinkedText',
  'moveToPreviousNonLinkedText',
  'moveToNextSeparator',
  'moveToPreviousSeparator',
  'moveToNextFrame',
  'moveToPreviousFrame',
  'moveToNextAnnotation',
  'moveToPreviousAnnotation',
  'moveToNextSpellingError',
  'moveToPreviousSpellingError',
  'moveToNextEmbeddedObject',
  'moveToPreviousEmbeddedObject',
  'moveToStartOfContainer',
  'movePastEndOfContainer',
  // Browse mode control
  'toggleBetweenBrowseAndFocusMode',
  'exitFocusMode',
  'browseModeElementsList',
  'toggleSingleLetterNavigation',
  'refreshBrowseDocument',
  // Reading and reporting
  'sayAll',
  'readLine',
  'readCurrentSelection',
  'reportTextFormatting',
  'reportTitle',
  'reportCurrentFocus',
  'readActiveWindow',
  'reportStatusBar',
  'reportDateTime',
  'reportClipboardText',
  // Find
  'find',
  'findNext',
  'findPrevious',
  'openLongDescription',
  // Speech
  'stopSpeech',
  'pauseSpeech',
] as const;

type PerformCommandName = (typeof PERFORM_COMMAND_NAMES)[number];

function defineTools(): Tool[] {
  return [
    {
      name: 'nvda_start',
      description:
        'Start NVDA screen reader. Must be called before any other NVDA commands. Requires Windows.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_stop',
      description: 'Stop NVDA screen reader. Call when done to properly clean up.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_next',
      description:
        'Move the NVDA cursor to the next item. Equivalent to pressing Down Arrow in browse mode.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_previous',
      description:
        'Move the NVDA cursor to the previous item. Equivalent to pressing Up Arrow in browse mode.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_act',
      description: 'Perform the default action for the current item. Equivalent to pressing Enter.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_interact',
      description:
        'Interact with the current item. No-op on NVDA (provided for cross-screen-reader API compatibility).',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_stop_interacting',
      description:
        'Stop interacting with the current item. No-op on NVDA (provided for cross-screen-reader API compatibility).',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_press',
      description: [
        "Press a key on the focused item (e.g., 'Enter', 'Tab', 'ArrowDown', 'Control+f').",
        '',
        'NVDA single-letter browse mode shortcuts (work in browse mode directly via nvda_press):',
        '  h / Shift+h — next/previous heading',
        '  1-6 / Shift+1-6 — next/previous heading at level 1-6',
        '  k / Shift+k — next/previous link',
        '  f / Shift+f — next/previous form field',
        '  d / Shift+d — next/previous landmark region',
        '  b / Shift+b — next/previous button',
        '  x / Shift+x — next/previous checkbox',
        '  r / Shift+r — next/previous radio button',
        '  e / Shift+e — next/previous edit field',
        '  c / Shift+c — next/previous combo box',
        '  t / Shift+t — next/previous table',
        '  l / Shift+l — next/previous list',
        '  i / Shift+i — next/previous list item',
        '  g / Shift+g — next/previous graphic',
        'Prefer nvda_perform for semantic navigation commands (cross-platform named commands).',
      ].join('\n'),
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description:
              "Key to press (e.g., 'Enter', 'Tab', 'ArrowDown', 'h', 'Control+f'). Use modifier+key syntax for combinations.",
          },
        },
        required: ['key'],
      },
    },
    {
      name: 'nvda_type',
      description: 'Type text into the focused item.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to type into the focused item',
          },
        },
        required: ['text'],
      },
    },
    {
      name: 'nvda_perform',
      description: [
        'Perform a named NVDA keyboard command for semantic navigation.',
        '',
        'KEY COMMANDS FOR WEB AUDITING:',
        '  Headings: moveToNextHeading / moveToPreviousHeading',
        '  Heading levels: moveToNextHeadingLevel1..6 / moveToPreviousHeadingLevel1..6',
        '  Links: moveToNextLink / moveToPreviousLink',
        '  Unvisited links: moveToNextUnvisitedLink / moveToPreviousUnvisitedLink',
        '  Landmarks: moveToNextLandmark / moveToPreviousLandmark',
        '  Form fields: moveToNextFormField / moveToPreviousFormField',
        '  Buttons: moveToNextButton / moveToPreviousButton',
        '  Checkboxes: moveToNextCheckbox / moveToPreviousCheckbox',
        '  Combo boxes: moveToNextComboBox / moveToPreviousComboBox',
        '  Radio buttons: moveToNextRadioButton / moveToPreviousRadioButton',
        '  Edit fields: moveToNextEditField / moveToPreviousEditField',
        '  Tables: moveToNextTable / moveToPreviousTable',
        '  Table navigation: moveToNextColumn / moveToPreviousColumn / moveToNextRow / moveToPreviousRow',
        '  Lists: moveToNextList / moveToPreviousList',
        '  List items: moveToNextListItem / moveToPreviousListItem',
        '  Graphics: moveToNextGraphic / moveToPreviousGraphic',
        '  Elements list dialog: browseModeElementsList (NVDA+F7 — shows all headings/links/forms)',
        '  Toggle browse/focus mode: toggleBetweenBrowseAndFocusMode',
        '  Say all: sayAll',
        '  Report title: reportTitle',
        '  Report focus: reportCurrentFocus',
        '  Find text: find / findNext / findPrevious',
        '  Text formatting: reportTextFormatting',
        '  Stop speech: stopSpeech',
      ].join('\n'),
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            enum: [...PERFORM_COMMAND_NAMES] as PerformCommandName[],
            description: 'Named NVDA keyboard command to execute',
          },
        },
        required: ['command'],
      },
    },
    {
      name: 'nvda_item_text',
      description:
        'Get the text of the item currently in the NVDA cursor. On NVDA this is the same as the last spoken phrase.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_last_spoken_phrase',
      description: 'Get the last phrase spoken by NVDA.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_spoken_phrase_log',
      description: 'Get the log of all spoken phrases for this NVDA session.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_item_text_log',
      description:
        'Get the log of all visited item text for this NVDA session. On NVDA this is the same as the spoken phrase log.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_clear_spoken_phrase_log',
      description: 'Clear the log of all spoken phrases for this NVDA session.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_clear_item_text_log',
      description: 'Clear the log of all visited item text for this NVDA session.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_click',
      description: 'Click the mouse at the current NVDA cursor position.',
      inputSchema: {
        type: 'object',
        properties: {
          button: {
            type: 'string',
            enum: ['left', 'right'],
            description: 'Mouse button to click (default: left)',
          },
          clickCount: {
            type: 'number',
            description: 'Number of times to click: 1, 2, or 3 (default: 1)',
          },
        },
      },
    },
    {
      name: 'nvda_detect',
      description:
        'Detect whether NVDA is supported on the current system. Returns true on Windows, false on macOS or Linux.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'nvda_default',
      description:
        'Check whether NVDA is the default screen reader for this OS. Returns true on Windows, false elsewhere.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

function buildHandlers(screenReader: ScreenReaderPort): Map<string, ToolHandler> {
  const handlers = new Map<string, ToolHandler>();

  handlers.set('nvda_start', async () => {
    const res = await screenReader.start();
    return result.json(res);
  });

  handlers.set('nvda_stop', async () => {
    const res = await screenReader.stop();
    return result.json(res);
  });

  handlers.set('nvda_next', async () => {
    const res = await screenReader.next();
    return result.json(res);
  });

  handlers.set('nvda_previous', async () => {
    const res = await screenReader.previous();
    return result.json(res);
  });

  handlers.set('nvda_act', async () => {
    const res = await screenReader.act();
    return result.json(res);
  });

  handlers.set('nvda_interact', async () => {
    const res = await screenReader.interact();
    return result.json(res);
  });

  handlers.set('nvda_stop_interacting', async () => {
    const res = await screenReader.stopInteracting();
    return result.json(res);
  });

  handlers.set('nvda_press', async (args) => {
    if (!args.key) {
      throw new Error('key parameter is required');
    }
    const res = await screenReader.press(args.key as string);
    return result.json(res);
  });

  handlers.set('nvda_type', async (args) => {
    if (!args.text) {
      throw new Error('text parameter is required');
    }
    const res = await screenReader.type(args.text as string);
    return result.json(res);
  });

  handlers.set('nvda_perform', async (args) => {
    if (!args.command) {
      throw new Error('command parameter is required');
    }
    const res = await screenReader.perform(args.command as string);
    return result.json(res);
  });

  handlers.set('nvda_item_text', async () => {
    const text = await screenReader.itemText();
    return result.text(text);
  });

  handlers.set('nvda_last_spoken_phrase', async () => {
    const phrase = await screenReader.lastSpokenPhrase();
    return result.text(phrase);
  });

  handlers.set('nvda_spoken_phrase_log', async () => {
    const log = await screenReader.spokenPhraseLog();
    return result.json(log);
  });

  handlers.set('nvda_item_text_log', async () => {
    const log = await screenReader.itemTextLog();
    return result.json(log);
  });

  handlers.set('nvda_clear_spoken_phrase_log', async () => {
    await screenReader.clearSpokenPhraseLog();
    return result.text('Spoken phrase log cleared');
  });

  handlers.set('nvda_clear_item_text_log', async () => {
    await screenReader.clearItemTextLog();
    return result.text('Item text log cleared');
  });

  handlers.set('nvda_click', async (args) => {
    const res = await screenReader.click({
      button: (args.button as 'left' | 'right') ?? 'left',
      clickCount: (args.clickCount as number) ?? 1,
    });
    return result.json(res);
  });

  handlers.set('nvda_detect', async () => {
    const supported = await screenReader.detect();
    return result.json({
      supported,
      message: supported
        ? 'NVDA is supported on this Windows system'
        : 'NVDA is not supported on this system (Windows required)',
    });
  });

  handlers.set('nvda_default', async () => {
    const isDefault = await screenReader.isDefault();
    return result.json({
      isDefault,
      message: isDefault
        ? 'NVDA is the default screen reader for this OS'
        : 'NVDA is not the default screen reader for this OS',
    });
  });

  return handlers;
}

export const createNvdaTools = (screenReader: ScreenReaderPort): ToolModule => ({
  tools: defineTools(),
  handlers: buildHandlers(screenReader),
});
