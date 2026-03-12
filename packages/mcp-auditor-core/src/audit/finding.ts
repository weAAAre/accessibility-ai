export type FindingType = 'violation' | 'warning' | 'pass';
export type FindingImpact = 'critical' | 'serious' | 'moderate' | 'minor';

export interface Finding {
  readonly id: string;
  readonly type: FindingType;
  readonly wcagCriteria: string[];
  readonly impact: FindingImpact;
  readonly element: string;
  readonly screenReaderOutput: string;
  readonly expectedBehavior: string;
  readonly recommendation: string;
}

let findingCounter = 0;

export function createFinding(params: Omit<Finding, 'id'>): Finding {
  findingCounter++;
  return {
    id: `F-${findingCounter.toString().padStart(3, '0')}`,
    ...params,
  };
}

export function resetFindingCounter(): void {
  findingCounter = 0;
}
