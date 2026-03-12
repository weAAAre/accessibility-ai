import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type {
  ClickOptions,
  ScreenReaderCommandResult,
  ScreenReaderPort,
} from '@weaaare/mcp-auditor-core';
import { type Browser, type BrowserContext, chromium, type Page } from 'playwright-core';

const _require = createRequire(import.meta.url);
const BROWSER_BUNDLE_PATH = join(
  dirname(_require.resolve('@guidepup/virtual-screen-reader/package.json')),
  'lib',
  'esm',
  'index.browser.js',
);
const BUNDLE_INTERCEPT_URL = 'https://virtual-sr-local/bundle.js';

const ADAPT_VIRTUAL_COMMANDS: Record<string, string> = {
  findNextHeading: 'moveToNextHeading',
  findPreviousHeading: 'moveToPreviousHeading',
  findNextLink: 'moveToNextLink',
  findPreviousLink: 'moveToPreviousLink',
  findNextControl: 'moveToNextForm',
  findPreviousControl: 'moveToPreviousForm',
};

export class VirtualScreenReaderAdapter implements ScreenReaderPort {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private getPage(): Page {
    if (!this.page) {
      throw new Error(
        'No page loaded. Call loadUrl() or loadHtml() before using the virtual screen reader.',
      );
    }
    return this.page;
  }

  private async ensureBrowser(): Promise<Page> {
    if (this.page) {
      try {
        await this.page.close();
      } catch {
        /* ignore */
      }
      this.page = null;
    }
    if (this.context) {
      try {
        await this.context.close();
      } catch {
        /* ignore */
      }
      this.context = null;
    }
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true, channel: 'chrome' });
    }
    this.context = await this.browser.newContext({ bypassCSP: true });
    this.page = await this.context.newPage();
    const bundleSource = readFileSync(BROWSER_BUNDLE_PATH, 'utf-8');
    await this.page.route(BUNDLE_INTERCEPT_URL, (route) => {
      route.fulfill({ contentType: 'application/javascript', body: bundleSource });
    });
    return this.page;
  }

  async loadUrl(url: string): Promise<void> {
    const page = await this.ensureBrowser();
    await page.goto(url, { waitUntil: 'load' });
  }

  async loadHtml(html: string): Promise<void> {
    const page = await this.ensureBrowser();
    await page.setContent(html, { waitUntil: 'load' });
  }

  async start(): Promise<ScreenReaderCommandResult> {
    const page = this.getPage();
    await page.evaluate(async (bundleUrl: string) => {
      const { virtual } = await import(bundleUrl);
      (globalThis as any).__guidepupVirtual = virtual;
      await virtual.start({ container: (globalThis as any).document.body });
    }, BUNDLE_INTERCEPT_URL);
    return { action: 'Virtual Screen Reader started successfully' };
  }

  async stop(): Promise<ScreenReaderCommandResult> {
    if (this.page) {
      try {
        await this.page.evaluate(async () => {
          const v = (globalThis as any).__guidepupVirtual;
          if (v) await v.stop();
        });
      } catch {
        /* page may already be closed */
      }
      try {
        await this.page.close();
      } catch {
        /* ignore */
      }
      this.page = null;
    }
    if (this.context) {
      try {
        await this.context.close();
      } catch {
        /* ignore */
      }
      this.context = null;
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        /* ignore */
      }
      this.browser = null;
    }
    return { action: 'Virtual Screen Reader stopped successfully' };
  }

  async next(): Promise<ScreenReaderCommandResult> {
    const data = await this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.next();
      return {
        itemText: (await v.itemText()) as string,
        spokenPhrase: (await v.lastSpokenPhrase()) as string,
      };
    });
    return { action: 'moved to next item', ...data };
  }

  async previous(): Promise<ScreenReaderCommandResult> {
    const data = await this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.previous();
      return {
        itemText: (await v.itemText()) as string,
        spokenPhrase: (await v.lastSpokenPhrase()) as string,
      };
    });
    return { action: 'moved to previous item', ...data };
  }

  async act(): Promise<ScreenReaderCommandResult> {
    const data = await this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.act();
      return { spokenPhrase: (await v.lastSpokenPhrase()) as string };
    });
    return { action: 'performed default action', ...data };
  }

  async interact(): Promise<ScreenReaderCommandResult> {
    await this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.interact();
    });
    return { action: 'interact (no-op in virtual screen reader)' };
  }

  async stopInteracting(): Promise<ScreenReaderCommandResult> {
    await this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.stopInteracting();
    });
    return { action: 'stop interacting (no-op in virtual screen reader)' };
  }

  async press(key: string): Promise<ScreenReaderCommandResult> {
    const data = await this.getPage().evaluate(async (k: string) => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.press(k);
      return { spokenPhrase: (await v.lastSpokenPhrase()) as string };
    }, key);
    return { action: `pressed key: ${key}`, ...data };
  }

  async type(text: string): Promise<ScreenReaderCommandResult> {
    await this.getPage().evaluate(async (t: string) => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.type(t);
    }, text);
    return { action: `typed: ${text}` };
  }

  async perform(command: string): Promise<ScreenReaderCommandResult> {
    const virtualCommand = ADAPT_VIRTUAL_COMMANDS[command] ?? command;
    const data = await this.getPage().evaluate(async (cmd: string) => {
      const v = (globalThis as any).__guidepupVirtual;
      const cmdValue = v.commands[cmd];
      if (!cmdValue) {
        throw new Error(
          `Unknown command: ${cmd}. Available: ${Object.keys(v.commands).join(', ')}`,
        );
      }
      await v.perform(cmdValue);
      return {
        itemText: (await v.itemText()) as string,
        spokenPhrase: (await v.lastSpokenPhrase()) as string,
      };
    }, virtualCommand);
    return { action: `performed command: ${command}`, ...data };
  }

  performCommander(_command: string): Promise<ScreenReaderCommandResult> {
    throw new Error(
      'Commander commands are not supported in Virtual Screen Reader. Use perform() with virtual navigation commands instead (e.g., moveToNextLandmark, moveToNextHeadingLevel1).',
    );
  }

  getCommanderCommands(): string[] {
    return [];
  }

  async itemText(): Promise<string> {
    return this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      return (await v.itemText()) as string;
    });
  }

  async lastSpokenPhrase(): Promise<string> {
    return this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      return (await v.lastSpokenPhrase()) as string;
    });
  }

  async spokenPhraseLog(): Promise<string[]> {
    return this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      return (await v.spokenPhraseLog()) as string[];
    });
  }

  async itemTextLog(): Promise<string[]> {
    return this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      return (await v.itemTextLog()) as string[];
    });
  }

  async clearSpokenPhraseLog(): Promise<void> {
    await this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.clearSpokenPhraseLog();
    });
  }

  async clearItemTextLog(): Promise<void> {
    await this.getPage().evaluate(async () => {
      const v = (globalThis as any).__guidepupVirtual;
      await v.clearItemTextLog();
    });
  }

  async click(options?: ClickOptions): Promise<ScreenReaderCommandResult> {
    const button = options?.button ?? 'left';
    const clickCount = options?.clickCount ?? 1;
    await this.getPage().evaluate(
      async (opts: { button: string; clickCount: number }) => {
        const v = (globalThis as any).__guidepupVirtual;
        await v.click({ button: opts.button, clickCount: opts.clickCount });
      },
      { button, clickCount },
    );
    return { action: 'clicked mouse', spokenPhrase: `${button} click x${clickCount}` };
  }

  async detect(): Promise<boolean> {
    return true;
  }

  async isDefault(): Promise<boolean> {
    return false;
  }
}
