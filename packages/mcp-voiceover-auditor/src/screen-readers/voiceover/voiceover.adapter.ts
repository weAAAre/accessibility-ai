import { voiceOver } from '@guidepup/guidepup';
import type {
  ClickOptions,
  ScreenReaderCommandResult,
  ScreenReaderPort,
} from '../screen-reader.port.js';

const PERFORM_COMMANDS: Record<string, string> = {
  findNextHeading: 'findNextHeading',
  findPreviousHeading: 'findPreviousHeading',
  findNextLink: 'findNextLink',
  findPreviousLink: 'findPreviousLink',
  findNextControl: 'findNextControl',
  findPreviousControl: 'findPreviousControl',
  moveToNext: 'moveToNext',
  moveToPrevious: 'moveToPrevious',
  performDefaultActionForItem: 'performDefaultActionForItem',
  describeItem: 'describeItem',
  jumpToTopEdge: 'jumpToTopEdge',
  jumpToBottomEdge: 'jumpToBottomEdge',
  jumpToLeftEdge: 'jumpToLeftEdge',
  jumpToRightEdge: 'jumpToRightEdge',
};

/**
 * Commander commands use VoiceOver's AppleScript API ("tell commander to perform command")
 * instead of System Events keyboard simulation. This makes them reliable even when
 * AppleScript keyboard control is not fully enabled in VoiceOver Utility.
 *
 * IMPORTANT: Keyboard commands (findNextHeading, etc.) use System Events key simulation
 * which FAILS when VoiceOver AppleScript control is disabled. Commander commands bypass this.
 */
const COMMANDER_COMMANDS: Record<string, string> = {
  // Navigation
  goToBeginning: 'go to beginning',
  goToEnd: 'go to end',
  goToDock: 'go to dock',
  goToDesktop: 'go to desktop',
  goToMenuBar: 'go to menu bar',
  goToTopOfWindow: 'go to top of window',
  goToBottomOfWindow: 'go to bottom of window',
  goToLinkedItem: 'go to linked item',
  moveUp: 'move up',
  moveDown: 'move down',
  moveLeft: 'move left',
  moveRight: 'move right',
  moveToNextSection: 'move to next section',
  moveToPreviousSection: 'move to previous section',
  // Cursor sync
  moveVoiceOverCursorToKeyboardFocus: 'move voiceover cursor to keyboard focus',
  moveKeyboardFocusToVoiceOverCursor: 'move keyboard focus to voiceover cursor',
  moveMousePointerToVoiceOverCursor: 'move mouse pointer to voiceover cursor',
  moveVoiceOverCursorToMousePointer: 'move voiceover cursor to mouse pointer',
  // Interaction
  startInteractingWithItem: 'start interacting with item',
  stopInteractingWithItem: 'stop interacting with item',
  performActionForItem: 'perform action for item',
  selectItem: 'select item',
  actions: 'actions',
  escape: 'escape',
  // Web navigation find commands (available as commander)
  findNextButton: 'find next button',
  findPreviousButton: 'find previous button',
  findNextLandmark: 'find next landmark',
  findPreviousLandmark: 'find previous landmark',
  findNextField: 'find next field',
  findPreviousField: 'find previous field',
  findNextTickbox: 'find next tickbox',
  findPreviousTickbox: 'find previous tickbox',
  findNextFrame: 'find next frame',
  findPreviousFrame: 'find previous frame',
  // Rotor
  rotor: 'rotor',
  nextRotorItem: 'next rotor item',
  previousRotorItem: 'previous rotor item',
  moveDownInRotor: 'move down in rotor',
  moveUpInRotor: 'move up in rotor',
  rotateLeft: 'rotate left',
  rotateRight: 'rotate right',
  // Quick Nav (critical for heading navigation workaround)
  toggleQuickNav: 'toggle quick nav on or off',
  toggleSingleKeyQuickNav: 'toggle single-key quick nav on or off',
  // Description
  describeItemInVoiceOverCursor: 'describe item in voiceover cursor',
  describeItemWithKeyboardFocus: 'describe item with keyboard focus',
  describeWindow: 'describe window',
  describeOpenApplications: 'describe open applications',
  // Reading
  readContentsOfVoiceOverCursor: 'read contents of voiceover cursor',
  readVisibleText: 'read visible text',
  readVoiceOverHint: 'read voiceover hint',
  readWebPageStatistics: 'read web page statistics',
  readLinkAddress: 'read link address',
  readSelectedTextOrItem: 'read selected text or item',
  // Scrolling
  scrollDownOnePage: 'scroll down one page',
  scrollUpOnePage: 'scroll up one page',
  scrollLeftOnePage: 'scroll left one page',
  scrollRightOnePage: 'scroll right one page',
  // Toggles
  toggleWebNavigationDomOrGroup: 'toggle web navigation dom or group',
  toggleInsertionPointNavigation: 'toggle insertion point navigation',
  alwaysAllowKeyboardCommandsToNavigateWebsites:
    'always allow keyboard commands to navigate websites',
};

export class VoiceOverAdapter implements ScreenReaderPort {
  async start(): Promise<ScreenReaderCommandResult> {
    await voiceOver.start({
      capture: true,
      timeout: 250,
      retries: 1,
    });
    return { action: 'VoiceOver started successfully' };
  }

  async stop(): Promise<ScreenReaderCommandResult> {
    await voiceOver.stop();
    return { action: 'VoiceOver stopped successfully' };
  }

  async next(): Promise<ScreenReaderCommandResult> {
    await voiceOver.next();
    const itemText = await voiceOver.itemText();
    const spokenPhrase = await voiceOver.lastSpokenPhrase();
    return { action: 'moved to next item', itemText, spokenPhrase };
  }

  async previous(): Promise<ScreenReaderCommandResult> {
    await voiceOver.previous();
    const itemText = await voiceOver.itemText();
    const spokenPhrase = await voiceOver.lastSpokenPhrase();
    return { action: 'moved to previous item', itemText, spokenPhrase };
  }

  async act(): Promise<ScreenReaderCommandResult> {
    await voiceOver.act();
    const spokenPhrase = await voiceOver.lastSpokenPhrase();
    return { action: 'performed default action', spokenPhrase };
  }

  async interact(): Promise<ScreenReaderCommandResult> {
    await voiceOver.interact();
    const spokenPhrase = await voiceOver.lastSpokenPhrase();
    return { action: 'started interacting', spokenPhrase };
  }

  async stopInteracting(): Promise<ScreenReaderCommandResult> {
    await voiceOver.stopInteracting();
    const spokenPhrase = await voiceOver.lastSpokenPhrase();
    return { action: 'stopped interacting', spokenPhrase };
  }

  async press(key: string): Promise<ScreenReaderCommandResult> {
    await voiceOver.press(key);
    const spokenPhrase = await voiceOver.lastSpokenPhrase();
    return { action: `pressed key: ${key}`, spokenPhrase };
  }

  async type(text: string): Promise<ScreenReaderCommandResult> {
    await voiceOver.type(text);
    return { action: `typed: ${text}` };
  }

  async perform(command: string): Promise<ScreenReaderCommandResult> {
    const keyboardCommands = voiceOver.keyboardCommands;

    const commandMap: Record<string, unknown> = {
      findNextHeading: keyboardCommands.findNextHeading,
      findPreviousHeading: keyboardCommands.findPreviousHeading,
      findNextLink: keyboardCommands.findNextLink,
      findPreviousLink: keyboardCommands.findPreviousLink,
      findNextControl: keyboardCommands.findNextControl,
      findPreviousControl: keyboardCommands.findPreviousControl,
      moveToNext: keyboardCommands.moveToNext,
      moveToPrevious: keyboardCommands.moveToPrevious,
      performDefaultActionForItem: keyboardCommands.performDefaultActionForItem,
      describeItem: keyboardCommands.describeItem,
      jumpToTopEdge: keyboardCommands.jumpToTopEdge,
      jumpToBottomEdge: keyboardCommands.jumpToBottomEdge,
      jumpToLeftEdge: keyboardCommands.jumpToLeftEdge,
      jumpToRightEdge: keyboardCommands.jumpToRightEdge,
    };

    const keyboardCommand = commandMap[command];
    if (!keyboardCommand) {
      throw new Error(
        `Unknown command: ${command}. Available: ${Object.keys(PERFORM_COMMANDS).join(', ')}`,
      );
    }

    await voiceOver.perform(keyboardCommand as Parameters<typeof voiceOver.perform>[0]);
    const itemText = await voiceOver.itemText();
    const spokenPhrase = await voiceOver.lastSpokenPhrase();
    return {
      action: `performed command: ${command}`,
      itemText,
      spokenPhrase,
    };
  }

  /**
   * Execute a VoiceOver commander command via AppleScript API.
   * Commander commands bypass System Events keyboard simulation,
   * making them reliable when AppleScript keyboard control is not enabled.
   *
   * Use this when keyboard commands (perform) fail silently.
   */
  async performCommander(command: string): Promise<ScreenReaderCommandResult> {
    const commandString = COMMANDER_COMMANDS[command];
    if (!commandString) {
      throw new Error(
        `Unknown commander command: ${command}. Available: ${Object.keys(COMMANDER_COMMANDS).join(', ')}`,
      );
    }

    // Commander commands are plain strings — guidepup routes them through
    // VoiceOver's AppleScript API: tell commander to perform command "..."
    await voiceOver.perform(commandString as Parameters<typeof voiceOver.perform>[0]);
    const itemText = await voiceOver.itemText();
    const spokenPhrase = await voiceOver.lastSpokenPhrase();
    return {
      action: `performed commander: ${command}`,
      itemText,
      spokenPhrase,
    };
  }

  /**
   * Get all available commander command names.
   */
  getCommanderCommands(): string[] {
    return Object.keys(COMMANDER_COMMANDS);
  }

  async itemText(): Promise<string> {
    return voiceOver.itemText();
  }

  async lastSpokenPhrase(): Promise<string> {
    return voiceOver.lastSpokenPhrase();
  }

  async spokenPhraseLog(): Promise<string[]> {
    return voiceOver.spokenPhraseLog();
  }

  async itemTextLog(): Promise<string[]> {
    return voiceOver.itemTextLog();
  }

  async clearSpokenPhraseLog(): Promise<void> {
    await voiceOver.clearSpokenPhraseLog();
  }

  async clearItemTextLog(): Promise<void> {
    await voiceOver.clearItemTextLog();
  }

  async click(options?: ClickOptions): Promise<ScreenReaderCommandResult> {
    const button = options?.button ?? 'left';
    const clickCount = options?.clickCount ?? 1;

    if (![1, 2, 3].includes(clickCount)) {
      throw new Error('clickCount must be 1, 2, or 3.');
    }

    await voiceOver.click({ button, clickCount: clickCount as 1 | 2 | 3 });
    return {
      action: 'clicked mouse',
      spokenPhrase: `${button} click x${clickCount}`,
    };
  }

  async detect(): Promise<boolean> {
    return voiceOver.detect();
  }

  async isDefault(): Promise<boolean> {
    return voiceOver.default();
  }
}
