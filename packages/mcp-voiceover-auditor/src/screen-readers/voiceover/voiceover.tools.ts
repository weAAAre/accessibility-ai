import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ScreenReaderPort, ToolHandler, ToolModule } from '@weaaare/mcp-auditor-core';
import { result } from '@weaaare/mcp-auditor-core';

const PERFORM_COMMAND_NAMES = [
  'findNextHeading',
  'findPreviousHeading',
  'findNextLink',
  'findPreviousLink',
  'findNextControl',
  'findPreviousControl',
  'moveToNext',
  'moveToPrevious',
  'performDefaultActionForItem',
  'describeItem',
  'jumpToTopEdge',
  'jumpToBottomEdge',
  'jumpToLeftEdge',
  'jumpToRightEdge',
] as const;

function defineTools(): Tool[] {
  return [
    {
      name: 'voiceover_start',
      description:
        'Start VoiceOver screen reader. Must be called before any other VoiceOver commands.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_stop',
      description: 'Stop VoiceOver screen reader. Call when done to properly clean up.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_next',
      description: 'Move the VoiceOver cursor to the next item. Equivalent to VO-Right Arrow.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_previous',
      description: 'Move the VoiceOver cursor to the previous item. Equivalent to VO-Left Arrow.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_act',
      description: 'Perform the default action for the current item. Equivalent to VO-Space.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_interact',
      description: 'Interact with the current item. Equivalent to VO-Shift-Down Arrow.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_stop_interacting',
      description: 'Stop interacting with the current item. Equivalent to VO-Shift-Up Arrow.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_press',
      description:
        "Press a key on the focused item (e.g., 'Enter', 'Tab', 'ArrowDown', 'Command+f').",
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: "Key to press (e.g., 'Enter', 'Tab', 'ArrowDown')",
          },
        },
        required: ['key'],
      },
    },
    {
      name: 'voiceover_type',
      description: 'Type text into the focused item.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to type',
          },
        },
        required: ['text'],
      },
    },
    {
      name: 'voiceover_perform',
      description:
        "Perform a VoiceOver keyboard command for advanced navigation (headings, links, controls). WARNING: These use System Events keyboard simulation which may FAIL if VoiceOver AppleScript control is not enabled. If commands don't work (cursor doesn't move), use voiceover_commander instead.",
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            enum: [...PERFORM_COMMAND_NAMES],
            description: 'VoiceOver keyboard command to perform',
          },
        },
        required: ['command'],
      },
    },
    {
      name: 'voiceover_commander',
      description: [
        'Execute a VoiceOver commander command via the AppleScript API.',
        "Unlike voiceover_perform (keyboard simulation), commander commands use VoiceOver's native API and work RELIABLY even when AppleScript keyboard control is not enabled.",
        '',
        'KEY COMMANDS FOR WEB AUDITING:',
        '- toggleSingleKeyQuickNav: Enable single-key Quick Nav for fast element-type navigation.',
        "  Once enabled, press keys to jump directly: 'h' headings, 'l' links, 'f' form controls, 'i' images, 'w' landmarks, 't' tables, 'x' lists, '1'-'6' heading levels. Shift+key for previous.",
        '- findNextLandmark/findPreviousLandmark: Jump directly to next/previous ARIA landmark.',
        '- findNextField/findNextButton/findNextTickbox: Jump to specific form control types.',
        '- readImageDescriptionForItem: Read the image description of the current item.',
        '- goToBeginning: Jump to beginning of web content.',
        '- moveVoiceOverCursorToKeyboardFocus: Sync VoiceOver cursor with keyboard focus (useful after Playwright interactions).',
        '- startInteractingWithItem / stopInteractingWithItem: Enter/exit container elements.',
        '- rotor: Open the VoiceOver rotor for structured navigation by category (headings, links, images, form controls, landmarks, etc.).',
        '- rotateLeft/rotateRight + moveDownInRotor/moveUpInRotor: Select rotor category then navigate items.',
        '- toggleWebNavigationDomOrGroup: Switch between DOM and group web navigation modes.',
        '- describeItemInVoiceOverCursor: Get detailed description of current item.',
        '- readWebPageStatistics: Get page statistics.',
      ].join('\n'),
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            enum: [
              // Navigation
              'goToBeginning',
              'goToEnd',
              'goToDock',
              'goToDesktop',
              'goToMenuBar',
              'goToTopOfWindow',
              'goToBottomOfWindow',
              'goToLinkedItem',
              'moveUp',
              'moveDown',
              'moveLeft',
              'moveRight',
              'moveToNextSection',
              'moveToPreviousSection',
              // Cursor sync
              'moveVoiceOverCursorToKeyboardFocus',
              'moveKeyboardFocusToVoiceOverCursor',
              'moveMousePointerToVoiceOverCursor',
              'moveVoiceOverCursorToMousePointer',
              // Interaction
              'startInteractingWithItem',
              'stopInteractingWithItem',
              'performActionForItem',
              'selectItem',
              'actions',
              'escape',
              // Web find commands
              'findNextButton',
              'findPreviousButton',
              'findNextLandmark',
              'findPreviousLandmark',
              'findNextField',
              'findPreviousField',
              'findNextTickbox',
              'findPreviousTickbox',
              'findNextFrame',
              'findPreviousFrame',
              'findNextLiveRegion',
              'findPreviousRegion',
              'findNextRadioGroup',
              'findPreviousGroup',
              'findNextAutoWebSpot',
              'findPreviousAutoWebSpot',
              'findNextWebSpot',
              'findPreviousWebSpot',
              // Rotor
              'rotor',
              'nextRotorItem',
              'previousRotorItem',
              'moveDownInRotor',
              'moveUpInRotor',
              'rotateLeft',
              'rotateRight',
              // Quick Nav
              'toggleQuickNav',
              'toggleSingleKeyQuickNav',
              // Description & Reading
              'describeItemInVoiceOverCursor',
              'describeItemWithKeyboardFocus',
              'describeWindow',
              'describeOpenApplications',
              'readContentsOfVoiceOverCursor',
              'readVisibleText',
              'readVoiceOverHint',
              'readWebPageStatistics',
              'readLinkAddress',
              'readImageDescriptionForItem',
              'readSelectedTextOrItem',
              // Scrolling
              'scrollDownOnePage',
              'scrollUpOnePage',
              'scrollLeftOnePage',
              'scrollRightOnePage',
              // Toggles
              'toggleWebNavigationDomOrGroup',
              'toggleInsertionPointNavigation',
              'alwaysAllowKeyboardCommandsToNavigateWebsites',
            ],
            description: 'VoiceOver commander command to execute',
          },
        },
        required: ['command'],
      },
    },
    {
      name: 'voiceover_item_text',
      description: 'Get the text of the item currently in the VoiceOver cursor.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_last_spoken_phrase',
      description: 'Get the last phrase spoken by VoiceOver.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_spoken_phrase_log',
      description: 'Get the log of all spoken phrases for this VoiceOver session.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_item_text_log',
      description: 'Get the log of all visited item text for this VoiceOver session.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_clear_spoken_phrase_log',
      description: 'Clear the log of all spoken phrases.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_clear_item_text_log',
      description: 'Clear the log of all visited item text.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_click',
      description: 'Click the mouse at the current position.',
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
            description: 'Number of times to click (default: 1)',
          },
        },
      },
    },
    {
      name: 'voiceover_detect',
      description: 'Detect whether VoiceOver is supported on this system. Returns true for macOS.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'voiceover_default',
      description: 'Check if VoiceOver is the default screen reader for this OS.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

function buildHandlers(screenReader: ScreenReaderPort): Map<string, ToolHandler> {
  const handlers = new Map<string, ToolHandler>();

  handlers.set('voiceover_start', async () => {
    const res = await screenReader.start();
    return result.json(res);
  });

  handlers.set('voiceover_stop', async () => {
    const res = await screenReader.stop();
    return result.json(res);
  });

  handlers.set('voiceover_next', async () => {
    const res = await screenReader.next();
    return result.json(res);
  });

  handlers.set('voiceover_previous', async () => {
    const res = await screenReader.previous();
    return result.json(res);
  });

  handlers.set('voiceover_act', async () => {
    const res = await screenReader.act();
    return result.json(res);
  });

  handlers.set('voiceover_interact', async () => {
    const res = await screenReader.interact();
    return result.json(res);
  });

  handlers.set('voiceover_stop_interacting', async () => {
    const res = await screenReader.stopInteracting();
    return result.json(res);
  });

  handlers.set('voiceover_press', async (args) => {
    if (!args.key) {
      throw new Error('key parameter is required');
    }
    const res = await screenReader.press(args.key as string);
    return result.json(res);
  });

  handlers.set('voiceover_type', async (args) => {
    if (!args.text) {
      throw new Error('text parameter is required');
    }
    const res = await screenReader.type(args.text as string);
    return result.json(res);
  });

  handlers.set('voiceover_perform', async (args) => {
    if (!args.command) {
      throw new Error('command parameter is required');
    }
    const res = await screenReader.perform(args.command as string);
    return result.json(res);
  });

  handlers.set('voiceover_commander', async (args) => {
    if (!args.command) {
      throw new Error('command parameter is required');
    }
    const res = await screenReader.performCommander(args.command as string);
    return result.json(res);
  });

  handlers.set('voiceover_item_text', async () => {
    const text = await screenReader.itemText();
    return result.text(text);
  });

  handlers.set('voiceover_last_spoken_phrase', async () => {
    const phrase = await screenReader.lastSpokenPhrase();
    return result.text(phrase);
  });

  handlers.set('voiceover_spoken_phrase_log', async () => {
    const log = await screenReader.spokenPhraseLog();
    return result.json(log);
  });

  handlers.set('voiceover_item_text_log', async () => {
    const log = await screenReader.itemTextLog();
    return result.json(log);
  });

  handlers.set('voiceover_clear_spoken_phrase_log', async () => {
    await screenReader.clearSpokenPhraseLog();
    return result.text('Spoken phrase log cleared');
  });

  handlers.set('voiceover_clear_item_text_log', async () => {
    await screenReader.clearItemTextLog();
    return result.text('Item text log cleared');
  });

  handlers.set('voiceover_click', async (args) => {
    const res = await screenReader.click({
      button: (args.button as 'left' | 'right') ?? 'left',
      clickCount: (args.clickCount as number) ?? 1,
    });
    return result.json(res);
  });

  handlers.set('voiceover_detect', async () => {
    const supported = await screenReader.detect();
    return result.json({
      supported,
      message: supported
        ? 'VoiceOver is supported on this system'
        : 'VoiceOver is not supported on this system',
    });
  });

  handlers.set('voiceover_default', async () => {
    const isDefault = await screenReader.isDefault();
    return result.json({
      isDefault,
      message: isDefault
        ? 'VoiceOver is the default screen reader'
        : 'VoiceOver is not the default screen reader',
    });
  });

  return handlers;
}

export function createVoiceOverTools(screenReader: ScreenReaderPort): ToolModule {
  return {
    tools: defineTools(),
    handlers: buildHandlers(screenReader),
  };
}
