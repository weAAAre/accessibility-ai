import { nvda } from '@guidepup/guidepup';
import type {
  ClickOptions,
  ScreenReaderCommandResult,
  ScreenReaderPort,
} from '@weaaare/mcp-auditor-core';

const buildCommandMap = (): Record<string, unknown> => {
  const kc = nvda.keyboardCommands;
  return {
    // ── Basic navigation ──────────────────────────────────────────────────────
    moveToNext: kc.moveToNext,
    moveToPrevious: kc.moveToPrevious,
    readNextFocusableItem: kc.readNextFocusableItem,
    performDefaultActionForItem: kc.performDefaultActionForItem,
    activate: kc.activate,

    // ── Browse mode — Headings ────────────────────────────────────────────────
    moveToNextHeading: kc.moveToNextHeading,
    moveToPreviousHeading: kc.moveToPreviousHeading,
    moveToNextHeadingLevel1: kc.moveToNextHeadingLevel1,
    moveToPreviousHeadingLevel1: kc.moveToPreviousHeadingLevel1,
    moveToNextHeadingLevel2: kc.moveToNextHeadingLevel2,
    moveToPreviousHeadingLevel2: kc.moveToPreviousHeadingLevel2,
    moveToNextHeadingLevel3: kc.moveToNextHeadingLevel3,
    moveToPreviousHeadingLevel3: kc.moveToPreviousHeadingLevel3,
    moveToNextHeadingLevel4: kc.moveToNextHeadingLevel4,
    moveToPreviousHeadingLevel4: kc.moveToPreviousHeadingLevel4,
    moveToNextHeadingLevel5: kc.moveToNextHeadingLevel5,
    moveToPreviousHeadingLevel5: kc.moveToPreviousHeadingLevel5,
    moveToNextHeadingLevel6: kc.moveToNextHeadingLevel6,
    moveToPreviousHeadingLevel6: kc.moveToPreviousHeadingLevel6,

    // ── Browse mode — Links ───────────────────────────────────────────────────
    moveToNextLink: kc.moveToNextLink,
    moveToPreviousLink: kc.moveToPreviousLink,
    moveToNextUnvisitedLink: kc.moveToNextUnvisitedLink,
    moveToPreviousUnvisitedLink: kc.moveToPreviousUnvisitedLink,
    moveToNextVisitedLink: kc.moveToNextVisitedLink,
    moveToPreviousVisitedLink: kc.moveToPreviousVisitedLink,

    // ── Browse mode — Forms ───────────────────────────────────────────────────
    moveToNextFormField: kc.moveToNextFormField,
    moveToPreviousFormField: kc.moveToPreviousFormField,
    moveToNextButton: kc.moveToNextButton,
    moveToPreviousButton: kc.moveToPreviousButton,
    moveToNextCheckbox: kc.moveToNextCheckbox,
    moveToPreviousCheckbox: kc.moveToPreviousCheckbox,
    moveToNextComboBox: kc.moveToNextComboBox,
    moveToPreviousComboBox: kc.moveToPreviousComboBox,
    moveToNextRadioButton: kc.moveToNextRadioButton,
    moveToPreviousRadioButton: kc.moveToPreviousRadioButton,
    moveToNextEditField: kc.moveToNextEditField,
    moveToPreviousEditField: kc.moveToPreviousEditField,

    // ── Browse mode — Landmarks ───────────────────────────────────────────────
    moveToNextLandmark: kc.moveToNextLandmark,
    moveToPreviousLandmark: kc.moveToPreviousLandmark,

    // ── Browse mode — Tables ──────────────────────────────────────────────────
    moveToNextTable: kc.moveToNextTable,
    moveToPreviousTable: kc.moveToPreviousTable,
    moveToNextColumn: kc.moveToNextColumn,
    moveToPreviousColumn: kc.moveToPreviousColumn,
    moveToNextRow: kc.moveToNextRow,
    moveToPreviousRow: kc.moveToPreviousRow,

    // ── Browse mode — Lists ───────────────────────────────────────────────────
    moveToNextList: kc.moveToNextList,
    moveToPreviousList: kc.moveToPreviousList,
    moveToNextListItem: kc.moveToNextListItem,
    moveToPreviousListItem: kc.moveToPreviousListItem,

    // ── Browse mode — Other elements ──────────────────────────────────────────
    moveToNextGraphic: kc.moveToNextGraphic,
    moveToPreviousGraphic: kc.moveToPreviousGraphic,
    moveToNextBlockQuote: kc.moveToNextBlockQuote,
    moveToPreviousBlockQuote: kc.moveToPreviousBlockQuote,
    moveToNextNonLinkedText: kc.moveToNextNonLinkedText,
    moveToPreviousNonLinkedText: kc.moveToPreviousNonLinkedText,
    moveToNextSeparator: kc.moveToNextSeparator,
    moveToPreviousSeparator: kc.moveToPreviousSeparator,
    moveToNextFrame: kc.moveToNextFrame,
    moveToPreviousFrame: kc.moveToPreviousFrame,
    moveToNextAnnotation: kc.moveToNextAnnotation,
    moveToPreviousAnnotation: kc.moveToPreviousAnnotation,
    moveToNextSpellingError: kc.moveToNextSpellingError,
    moveToPreviousSpellingError: kc.moveToPreviousSpellingError,
    moveToNextEmbeddedObject: kc.moveToNextEmbeddedObject,
    moveToPreviousEmbeddedObject: kc.moveToPreviousEmbeddedObject,
    moveToStartOfContainer: kc.moveToStartOfContainer,
    movePastEndOfContainer: kc.movePastEndOfContainer,

    // ── Browse mode — Mode control ────────────────────────────────────────────
    toggleBetweenBrowseAndFocusMode: kc.toggleBetweenBrowseAndFocusMode,
    exitFocusMode: kc.exitFocusMode,
    browseModeElementsList: kc.browseModeElementsList,
    toggleSingleLetterNavigation: kc.toggleSingleLetterNavigation,
    refreshBrowseDocument: kc.refreshBrowseDocument,

    // ── Reading and reporting ─────────────────────────────────────────────────
    sayAll: kc.sayAll,
    readLine: kc.readLine,
    readCurrentSelection: kc.readCurrentSelection,
    reportTextFormatting: kc.reportTextFormatting,
    reportTitle: kc.reportTitle,
    reportCurrentFocus: kc.reportCurrentFocus,
    readActiveWindow: kc.readActiveWindow,
    reportStatusBar: kc.reportStatusBar,
    reportDateTime: kc.reportDateTime,
    reportClipboardText: kc.reportClipboardText,

    // ── Find ──────────────────────────────────────────────────────────────────
    find: kc.find,
    findNext: kc.findNext,
    findPrevious: kc.findPrevious,
    openLongDescription: kc.openLongDescription,

    // ── Speech control ────────────────────────────────────────────────────────
    stopSpeech: kc.stopSpeech,
    pauseSpeech: kc.pauseSpeech,
  };
};

export class NvdaAdapter implements ScreenReaderPort {
  async start(): Promise<ScreenReaderCommandResult> {
    await nvda.start();
    return { action: 'NVDA started successfully' };
  }

  async stop(): Promise<ScreenReaderCommandResult> {
    await nvda.stop();
    return { action: 'NVDA stopped successfully' };
  }

  async next(): Promise<ScreenReaderCommandResult> {
    await nvda.next();
    const itemText = await nvda.itemText();
    const spokenPhrase = await nvda.lastSpokenPhrase();
    return { action: 'moved to next item', itemText, spokenPhrase };
  }

  async previous(): Promise<ScreenReaderCommandResult> {
    await nvda.previous();
    const itemText = await nvda.itemText();
    const spokenPhrase = await nvda.lastSpokenPhrase();
    return { action: 'moved to previous item', itemText, spokenPhrase };
  }

  async act(): Promise<ScreenReaderCommandResult> {
    await nvda.act();
    const spokenPhrase = await nvda.lastSpokenPhrase();
    return { action: 'performed default action', spokenPhrase };
  }

  async interact(): Promise<ScreenReaderCommandResult> {
    await nvda.interact();
    const spokenPhrase = await nvda.lastSpokenPhrase();
    return { action: 'interact (no-op on NVDA)', spokenPhrase };
  }

  async stopInteracting(): Promise<ScreenReaderCommandResult> {
    await nvda.stopInteracting();
    const spokenPhrase = await nvda.lastSpokenPhrase();
    return { action: 'stopInteracting (no-op on NVDA)', spokenPhrase };
  }

  async press(key: string): Promise<ScreenReaderCommandResult> {
    await nvda.press(key);
    const spokenPhrase = await nvda.lastSpokenPhrase();
    return { action: `pressed key: ${key}`, spokenPhrase };
  }

  async type(text: string): Promise<ScreenReaderCommandResult> {
    await nvda.type(text);
    return { action: `typed: ${text}` };
  }

  async perform(command: string): Promise<ScreenReaderCommandResult> {
    const commandMap = buildCommandMap();
    const keyboardCommand = commandMap[command];

    if (!keyboardCommand) {
      throw new Error(
        `Unknown command: ${command}. Available: ${Object.keys(commandMap).join(', ')}`,
      );
    }

    await nvda.perform(keyboardCommand as Parameters<typeof nvda.perform>[0]);
    const itemText = await nvda.itemText();
    const spokenPhrase = await nvda.lastSpokenPhrase();
    return { action: `performed command: ${command}`, itemText, spokenPhrase };
  }

  async performCommander(command: string): Promise<ScreenReaderCommandResult> {
    // NVDA has no separate "commander" channel — keyboard commands are the only API.
    // This method exists for ScreenReaderPort compatibility.
    return this.perform(command);
  }

  getCommanderCommands(): string[] {
    return Object.keys(buildCommandMap());
  }

  async itemText(): Promise<string> {
    return nvda.itemText();
  }

  async lastSpokenPhrase(): Promise<string> {
    return nvda.lastSpokenPhrase();
  }

  async spokenPhraseLog(): Promise<string[]> {
    return nvda.spokenPhraseLog();
  }

  async itemTextLog(): Promise<string[]> {
    return nvda.itemTextLog();
  }

  async clearSpokenPhraseLog(): Promise<void> {
    await nvda.clearSpokenPhraseLog();
  }

  async clearItemTextLog(): Promise<void> {
    await nvda.clearItemTextLog();
  }

  async click(options?: ClickOptions): Promise<ScreenReaderCommandResult> {
    const button = options?.button ?? 'left';
    const clickCount = options?.clickCount ?? 1;

    if (![1, 2, 3].includes(clickCount)) {
      throw new Error('clickCount must be 1, 2, or 3.');
    }

    await nvda.click({ button, clickCount: clickCount as 1 | 2 | 3 });
    return {
      action: 'clicked mouse',
      spokenPhrase: `${button} click x${clickCount}`,
    };
  }

  async detect(): Promise<boolean> {
    return nvda.detect();
  }

  async isDefault(): Promise<boolean> {
    return nvda.default();
  }
}
