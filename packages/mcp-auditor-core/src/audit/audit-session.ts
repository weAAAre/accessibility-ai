import type { Finding, FindingImpact, FindingType } from './finding.js';
import { createFinding, resetFindingCounter } from './finding.js';

export type AuditStatus = 'idle' | 'in-progress' | 'completed';
export type ScreenReaderType = 'voiceover' | 'nvda' | 'virtual';

export interface AuditMetadata {
  readonly url: string;
  readonly screenReader: ScreenReaderType;
  readonly wcagLevel: 'A' | 'AA' | 'AAA';
  readonly browser?: string;
}

export interface AuditSummary {
  readonly status: AuditStatus;
  readonly url: string;
  readonly screenReader: ScreenReaderType;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly durationMs: number | null;
  readonly totalFindings: number;
  readonly violations: number;
  readonly warnings: number;
  readonly passes: number;
}

export class AuditSession {
  private status: AuditStatus = 'idle';
  private startedAt: Date | null = null;
  private endedAt: Date | null = null;
  private readonly findings: Finding[] = [];
  private metadata: AuditMetadata | null = null;

  start(metadata: AuditMetadata): void {
    if (this.status === 'in-progress') {
      throw new Error(
        'Audit already in progress. End the current audit before starting a new one.',
      );
    }
    resetFindingCounter();
    this.findings.length = 0;
    this.metadata = metadata;
    this.status = 'in-progress';
    this.startedAt = new Date();
    this.endedAt = null;
  }

  logFinding(params: {
    type: FindingType;
    wcagCriteria: string[];
    impact: FindingImpact;
    element: string;
    screenReaderOutput: string;
    expectedBehavior: string;
    recommendation: string;
  }): Finding {
    if (this.status !== 'in-progress') {
      throw new Error('No audit in progress. Call start_audit first.');
    }
    const finding = createFinding(params);
    this.findings.push(finding);
    return finding;
  }

  end(): AuditSummary {
    if (this.status !== 'in-progress') {
      throw new Error('No audit in progress.');
    }
    this.status = 'completed';
    this.endedAt = new Date();
    return this.summary();
  }

  summary(): AuditSummary {
    const durationMs =
      this.startedAt && this.endedAt
        ? this.endedAt.getTime() - this.startedAt.getTime()
        : this.startedAt
          ? Date.now() - this.startedAt.getTime()
          : null;

    const counts = this.findings.reduce(
      (acc, f) => {
        if (f.type === 'violation') acc.violations++;
        else if (f.type === 'warning') acc.warnings++;
        else if (f.type === 'pass') acc.passes++;
        return acc;
      },
      { violations: 0, warnings: 0, passes: 0 },
    );

    return {
      status: this.status,
      url: this.metadata?.url ?? '',
      screenReader: this.metadata?.screenReader ?? 'voiceover',
      startedAt: this.startedAt?.toISOString() ?? null,
      endedAt: this.endedAt?.toISOString() ?? null,
      durationMs,
      totalFindings: this.findings.length,
      violations: counts.violations,
      warnings: counts.warnings,
      passes: counts.passes,
    };
  }

  getFindings(): readonly Finding[] {
    return [...this.findings];
  }

  getMetadata(): AuditMetadata | null {
    return this.metadata;
  }

  isInProgress(): boolean {
    return this.status === 'in-progress';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }
}
