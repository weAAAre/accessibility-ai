import { execSync } from 'node:child_process';
import { macOSActivate } from '@guidepup/guidepup';

export interface ActiveApplicationInfo {
  readonly name: string;
}

export class ApplicationManager {
  async getActiveApplication(): Promise<ActiveApplicationInfo> {
    const script =
      'tell application "System Events" to get name of first application process whose frontmost is true';
    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script}'`, { encoding: 'utf-8' }, (error, stdout) => {
        if (error) {
          return reject(error);
        }
        resolve({ name: stdout.trim() });
      });
    });
  }

  async activateApplication(applicationName: string): Promise<void> {
    await macOSActivate(applicationName);
  }

  async ensureBrowserFocused(browserName = 'Google Chrome'): Promise<boolean> {
    const active = await this.getActiveApplication();
    if (active.name === browserName) {
      return true;
    }
    await this.activateApplication(browserName);
    return false;
  }
}
