import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import packageVersion from '../package.json' with { type: 'json' };
import { createAuditTools } from './audit/audit.tools.js';
import { AuditSession } from './audit/audit-session.js';
import { ApplicationManager } from './navigation/application-manager.js';
import { FocusTracker } from './navigation/focus-tracker.js';
import { createNavigationTools } from './navigation/navigation.tools.js';
import { getPromptMessages, listPrompts } from './prompts/audit-prompts.js';
import { createReportTools } from './reports/report.tools.js';
import { listResources, readResource } from './resources/audit-resources.js';
import { VirtualScreenReaderAdapter } from './screen-readers/virtual/virtual.adapter.js';
import { createVirtualTools } from './screen-readers/virtual/virtual.tools.js';
import { VoiceOverAdapter } from './screen-readers/voiceover/voiceover.adapter.js';
import { createVoiceOverTools } from './screen-readers/voiceover/voiceover.tools.js';
import { createSetupTools } from './setup/setup-check.tools.js';
import { ToolRegistry } from './tools/tool-registry.js';

export function createServer(): Server {
  const server = new Server(
    {
      name: 'mcp-voiceover-auditor',
      version: packageVersion.version,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    },
  );

  // --- Instantiate dependencies ---
  const voiceOverAdapter = new VoiceOverAdapter();
  const virtualAdapter = new VirtualScreenReaderAdapter();
  const appManager = new ApplicationManager();
  const focusTracker = new FocusTracker();
  const auditSession = new AuditSession();

  // --- Register tool modules ---
  const registry = new ToolRegistry();
  registry.register(createVoiceOverTools(voiceOverAdapter));
  registry.register(createVirtualTools(virtualAdapter));
  registry.register(createNavigationTools(appManager, focusTracker));
  registry.register(createSetupTools(voiceOverAdapter));
  registry.register(createAuditTools(auditSession));
  registry.register(createReportTools(auditSession));

  // --- Tools ---
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: registry.listTools(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return registry.callTool(name, (args as Record<string, unknown>) ?? {});
  });

  // --- Prompts ---
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: listPrompts(),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const messages = getPromptMessages(name, (args as Record<string, string | undefined>) ?? {});
    return {
      description: `Audit prompt: ${name}`,
      messages,
    };
  });

  // --- Resources ---
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: listResources(auditSession),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const content = readResource(uri, auditSession);
    return {
      contents: [content],
    };
  });

  return server;
}
