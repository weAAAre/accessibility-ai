import type { AuditSession } from '../audit/audit-session.js';
import type { Finding } from '../audit/finding.js';

export type ReportFormat = 'json' | 'csv' | 'markdown';

interface ReportData {
  readonly metadata: {
    url: string;
    screenReader: string;
    wcagLevel: string;
    startedAt: string | null;
    endedAt: string | null;
    durationMs: number | null;
  };
  readonly summary: {
    totalFindings: number;
    violations: number;
    warnings: number;
    passes: number;
  };
  readonly findings: readonly Finding[];
}

function buildReportData(session: AuditSession): ReportData {
  const summary = session.summary();
  return {
    metadata: {
      url: summary.url,
      screenReader: summary.screenReader,
      wcagLevel: session.getMetadata()?.wcagLevel ?? 'AA',
      startedAt: summary.startedAt,
      endedAt: summary.endedAt,
      durationMs: summary.durationMs,
    },
    summary: {
      totalFindings: summary.totalFindings,
      violations: summary.violations,
      warnings: summary.warnings,
      passes: summary.passes,
    },
    findings: session.getFindings(),
  };
}

function toJson(data: ReportData): string {
  return JSON.stringify(data, null, 2);
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function toCsv(data: ReportData): string {
  const headers = [
    'ID',
    'Type',
    'Impact',
    'WCAG Criteria',
    'Element',
    'Screen Reader Output',
    'Expected Behavior',
    'Recommendation',
  ];

  const rows = data.findings.map((f) =>
    [
      f.id,
      f.type,
      f.impact,
      f.wcagCriteria.join('; '),
      f.element,
      f.screenReaderOutput,
      f.expectedBehavior,
      f.recommendation,
    ]
      .map(escapeCsvField)
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

function toMarkdown(data: ReportData): string {
  const lines: string[] = [];

  lines.push('# Accessibility Audit Report');
  lines.push('');
  lines.push(`- **URL:** ${data.metadata.url}`);
  lines.push(`- **Screen Reader:** ${data.metadata.screenReader}`);
  lines.push(`- **WCAG Level:** ${data.metadata.wcagLevel}`);
  lines.push(`- **Date:** ${data.metadata.startedAt ?? 'N/A'}`);
  if (data.metadata.durationMs) {
    lines.push(`- **Duration:** ${Math.round(data.metadata.durationMs / 1000)}s`);
  }
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total findings | ${data.summary.totalFindings} |`);
  lines.push(`| Violations | ${data.summary.violations} |`);
  lines.push(`| Warnings | ${data.summary.warnings} |`);
  lines.push(`| Passes | ${data.summary.passes} |`);
  lines.push('');

  if (data.findings.length === 0) {
    lines.push('No findings recorded.');
    return lines.join('\n');
  }

  lines.push('## Findings');
  lines.push('');
  lines.push(
    '| ID | Type | Impact | WCAG | Element | Screen Reader Output | Expected | Recommendation |',
  );
  lines.push(
    '|-----|------|--------|------|---------|---------------------|----------|----------------|',
  );

  for (const f of data.findings) {
    lines.push(
      `| ${f.id} | ${f.type} | ${f.impact} | ${f.wcagCriteria.join(', ')} | ${f.element} | ${f.screenReaderOutput} | ${f.expectedBehavior} | ${f.recommendation} |`,
    );
  }

  return lines.join('\n');
}

export function generateReport(session: AuditSession, format: ReportFormat): string {
  const data = buildReportData(session);

  switch (format) {
    case 'json':
      return toJson(data);
    case 'csv':
      return toCsv(data);
    case 'markdown':
      return toMarkdown(data);
  }
}
