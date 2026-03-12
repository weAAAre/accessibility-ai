import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { AuditSession } from '../audit/audit-session.js';
import type { ToolHandler, ToolModule } from '../tools/tool-registry.js';
import { result } from '../tools/tool-registry.js';
import type { ReportFormat } from './report-generator.js';
import { generateReport } from './report-generator.js';

function defineTools(): Tool[] {
  return [
    {
      name: 'generate_report',
      description:
        'Generate an accessibility audit report from the current or last completed audit session. Supports JSON, CSV, and Markdown formats.',
      inputSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['json', 'csv', 'markdown'],
            description: 'Report format (default: markdown)',
          },
        },
      },
    },
  ];
}

function buildHandlers(session: AuditSession): Map<string, ToolHandler> {
  const handlers = new Map<string, ToolHandler>();

  handlers.set('generate_report', async (args) => {
    const format = (args.format as ReportFormat) ?? 'markdown';

    if (!session.isCompleted() && !session.isInProgress()) {
      throw new Error('No audit data available. Start and complete an audit first.');
    }

    const report = generateReport(session, format);

    return result.text(report);
  });

  return handlers;
}

export function createReportTools(session: AuditSession): ToolModule {
  return {
    tools: defineTools(),
    handlers: buildHandlers(session),
  };
}
