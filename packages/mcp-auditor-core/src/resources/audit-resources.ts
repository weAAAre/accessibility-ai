import type { AuditSession } from '../audit/audit-session.js';
import { generateReport } from '../reports/report-generator.js';

export interface ResourceDefinition {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
}

export function listResources(_session: AuditSession): ResourceDefinition[] {
  const resources: ResourceDefinition[] = [
    {
      uri: 'screenreader://audit/status',
      name: 'Audit Status',
      description: 'Current audit session status with finding counts and duration',
      mimeType: 'application/json',
    },
    {
      uri: 'screenreader://audit/findings',
      name: 'Audit Findings',
      description: 'All findings from the current or last audit session',
      mimeType: 'application/json',
    },
    {
      uri: 'screenreader://report/json',
      name: 'Audit Report (JSON)',
      description: 'Full audit report in JSON format',
      mimeType: 'application/json',
    },
    {
      uri: 'screenreader://report/csv',
      name: 'Audit Report (CSV)',
      description: 'Audit report in CSV format for spreadsheet import',
      mimeType: 'text/csv',
    },
    {
      uri: 'screenreader://report/markdown',
      name: 'Audit Report (Markdown)',
      description: 'Audit report in Markdown format',
      mimeType: 'text/markdown',
    },
  ];

  return resources;
}

export function readResource(
  uri: string,
  session: AuditSession,
): { uri: string; mimeType: string; text: string } {
  switch (uri) {
    case 'screenreader://audit/status':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(session.summary(), null, 2),
      };

    case 'screenreader://audit/findings':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(session.getFindings(), null, 2),
      };

    case 'screenreader://report/json':
      return {
        uri,
        mimeType: 'application/json',
        text: generateReport(session, 'json'),
      };

    case 'screenreader://report/csv':
      return {
        uri,
        mimeType: 'text/csv',
        text: generateReport(session, 'csv'),
      };

    case 'screenreader://report/markdown':
      return {
        uri,
        mimeType: 'text/markdown',
        text: generateReport(session, 'markdown'),
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
