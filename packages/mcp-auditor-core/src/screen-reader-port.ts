export interface ClickOptions {
  readonly button?: 'left' | 'right';
  readonly clickCount?: number;
}

export interface ScreenReaderCommandResult {
  readonly action: string;
  readonly itemText?: string;
  readonly spokenPhrase?: string;
}

export interface ScreenReaderPort {
  start(): Promise<ScreenReaderCommandResult>;
  stop(): Promise<ScreenReaderCommandResult>;
  next(): Promise<ScreenReaderCommandResult>;
  previous(): Promise<ScreenReaderCommandResult>;
  act(): Promise<ScreenReaderCommandResult>;
  interact(): Promise<ScreenReaderCommandResult>;
  stopInteracting(): Promise<ScreenReaderCommandResult>;
  press(key: string): Promise<ScreenReaderCommandResult>;
  type(text: string): Promise<ScreenReaderCommandResult>;
  perform(command: string): Promise<ScreenReaderCommandResult>;
  performCommander(command: string): Promise<ScreenReaderCommandResult>;
  getCommanderCommands(): string[];
  itemText(): Promise<string>;
  lastSpokenPhrase(): Promise<string>;
  spokenPhraseLog(): Promise<string[]>;
  itemTextLog(): Promise<string[]>;
  clearSpokenPhraseLog(): Promise<void>;
  clearItemTextLog(): Promise<void>;
  click(options?: ClickOptions): Promise<ScreenReaderCommandResult>;
  detect(): Promise<boolean>;
  isDefault(): Promise<boolean>;
}
