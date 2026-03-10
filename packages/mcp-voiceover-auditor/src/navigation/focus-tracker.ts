export interface FocusBreadcrumb {
  readonly application: string;
  readonly url?: string;
  readonly element?: string;
  readonly spokenPhrase?: string;
  readonly timestamp: number;
}

const MAX_BREADCRUMBS = 100;

export class FocusTracker {
  private readonly breadcrumbs: FocusBreadcrumb[] = [];

  record(breadcrumb: Omit<FocusBreadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now(),
    });

    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.splice(0, this.breadcrumbs.length - MAX_BREADCRUMBS);
    }
  }

  lastKnown(): FocusBreadcrumb | undefined {
    return this.breadcrumbs.at(-1);
  }

  lastKnownInApplication(application: string): FocusBreadcrumb | undefined {
    for (let i = this.breadcrumbs.length - 1; i >= 0; i--) {
      if (this.breadcrumbs[i].application === application) {
        return this.breadcrumbs[i];
      }
    }
    return undefined;
  }

  history(): readonly FocusBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  clear(): void {
    this.breadcrumbs.length = 0;
  }
}
