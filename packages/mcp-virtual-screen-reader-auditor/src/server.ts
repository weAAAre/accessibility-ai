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
import { getVirtualPromptMessages, listVirtualPrompts } from './prompts/virtual-prompts.js';
import { VirtualScreenReaderAdapter } from './screen-readers/virtual/virtual.adapter.js';
import { createVirtualTools } from './screen-readers/virtual/virtual.tools.js';

export const createServer = (): Server => {
  const server = new Server(
    {
      name: 'mcp-virtual-screen-reader-auditor',
      version: packageVersion.version,
    },
    { capabilities: { tools: {}, prompts: {}, resources: {} } },
  );

  const adapter = new VirtualScreenReaderAdapter();
  const session = new AuditSession();
  const registry = new ToolRegistry();

  registry.register(createVirtualTools(adapter));
  registry.register(createAuditTools(session));
  registry.register(createReportTools(session));

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
    prompts: listVirtualPrompts(),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const messages = getVirtualPromptMessages(
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
    resources: listResources(session),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return readResource(request.params.uri, session);
  });

  return server;
};
