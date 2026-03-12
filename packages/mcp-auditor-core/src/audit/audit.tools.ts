import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolModule } from '../tools/tool-registry.js';
import { result } from '../tools/tool-registry.js';
import type { AuditSession, ScreenReaderType } from './audit-session.js';
import type { FindingImpact, FindingType } from './finding.js';

function defineTools(): Tool[] {
  return [
    {
      name: 'start_audit',
      description:
        'Start a new accessibility audit session. Must be called before logging findings.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL being audited',
          },
          screenReader: {
            type: 'string',
            enum: ['voiceover', 'nvda', 'virtual'],
            description: 'Screen reader being used (default: voiceover)',
          },
          wcagLevel: {
            type: 'string',
            enum: ['A', 'AA', 'AAA'],
            description: 'WCAG conformance level to audit against (default: AA)',
          },
          browser: {
            type: 'string',
            description: "Browser being used (e.g., 'Google Chrome', 'Safari')",
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'log_finding',
      description:
        "Log an accessibility finding during an audit. Use 'violation' for failures, 'warning' for potential issues, 'pass' for verified accessible elements.",
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['violation', 'warning', 'pass'],
            description: 'Finding type',
          },
          wcagCriteria: {
            type: 'array',
            items: { type: 'string' },
            description: "WCAG success criteria (e.g., ['1.1.1', '4.1.2'])",
          },
          impact: {
            type: 'string',
            enum: ['critical', 'serious', 'moderate', 'minor'],
            description: 'Impact severity',
          },
          element: {
            type: 'string',
            description:
              "Element description or CSS selector (e.g., 'main heading h1', 'nav > ul > li:first-child a')",
          },
          screenReaderOutput: {
            type: 'string',
            description: 'What the screen reader actually announced',
          },
          expectedBehavior: {
            type: 'string',
            description: 'What the screen reader should have announced',
          },
          recommendation: {
            type: 'string',
            description: 'How to fix the issue',
          },
        },
        required: [
          'type',
          'wcagCriteria',
          'impact',
          'element',
          'screenReaderOutput',
          'expectedBehavior',
          'recommendation',
        ],
      },
    },
    {
      name: 'end_audit',
      description: 'End the current audit session and get a summary of findings.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_audit_status',
      description: 'Get the current audit status, including finding counts and duration.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_findings',
      description: 'Get all findings logged in the current or last completed audit session.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['violation', 'warning', 'pass'],
            description: 'Filter by finding type (optional)',
          },
        },
      },
    },
  ];
}

function buildHandlers(session: AuditSession): Map<string, ToolHandler> {
  const handlers = new Map<string, ToolHandler>();

  handlers.set('start_audit', async (args) => {
    if (!args.url) {
      throw new Error('url parameter is required');
    }
    session.start({
      url: args.url as string,
      screenReader: (args.screenReader as ScreenReaderType) ?? 'voiceover',
      wcagLevel: (args.wcagLevel as 'A' | 'AA' | 'AAA') ?? 'AA',
      browser: args.browser as string | undefined,
    });
    return result.json({
      message: 'Audit started',
      ...session.summary(),
    });
  });

  handlers.set('log_finding', async (args) => {
    const finding = session.logFinding({
      type: args.type as FindingType,
      wcagCriteria: args.wcagCriteria as string[],
      impact: args.impact as FindingImpact,
      element: args.element as string,
      screenReaderOutput: args.screenReaderOutput as string,
      expectedBehavior: args.expectedBehavior as string,
      recommendation: args.recommendation as string,
    });
    return result.json({
      message: 'Finding logged',
      finding,
      totalFindings: session.getFindings().length,
    });
  });

  handlers.set('end_audit', async () => {
    const summary = session.end();
    return result.json({
      message: 'Audit completed',
      summary,
    });
  });

  handlers.set('get_audit_status', async () => {
    return result.json(session.summary());
  });

  handlers.set('get_findings', async (args) => {
    let findings = session.getFindings();
    if (args.type) {
      findings = findings.filter((f) => f.type === args.type);
    }
    return result.json({
      count: findings.length,
      findings,
    });
  });

  return handlers;
}

export function createAuditTools(session: AuditSession): ToolModule {
  return {
    tools: defineTools(),
    handlers: buildHandlers(session),
  };
}
