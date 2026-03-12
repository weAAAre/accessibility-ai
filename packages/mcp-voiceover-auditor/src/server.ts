import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  AuditSession,
  createAuditTools,
  createReportTools,
  listResources,
  readResource,
  ToolRegistry,
} from '@weaaare/mcp-auditor-core';
import packageVersion from '../package.json' with { type: 'json' };
import { ApplicationManager } from './navigation/application-manager.js';
import { FocusTracker } from './navigation/focus-tracker.js';
import { createNavigationTools } from './navigation/navigation.tools.js';
import { getVoiceOverPromptMessages, listVoiceOverPrompts } from './prompts/audit-prompts.js';
import { VoiceOverAdapter } from './screen-readers/voiceover/voiceover.adapter.js';
import { createVoiceOverTools } from './screen-readers/voiceover/voiceover.tools.js';
import { createSetupTools } from './setup/setup-check.tools.js';

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
  const appManager = new ApplicationManager();
  const focusTracker = new FocusTracker();
  const auditSession = new AuditSession();

  // --- Register tool modules ---
  const registry = new ToolRegistry();
  registry.register(createVoiceOverTools(voiceOverAdapter));
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
    prompts: listVoiceOverPrompts(),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const messages = getVoiceOverPromptMessages(
      name,
      (args as Record<string, string | undefined>) ?? {},
    );
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
