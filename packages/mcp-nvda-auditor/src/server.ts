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
import { getNvdaPromptMessages, listNvdaPrompts } from './prompts/audit-prompts.js';
import { NvdaAdapter } from './screen-readers/nvda/nvda.adapter.js';
import { createNvdaTools } from './screen-readers/nvda/nvda.tools.js';
import { createSetupTools } from './setup/setup-check.tools.js';

export const createServer = (): Server => {
  const server = new Server(
    {
      name: 'mcp-nvda-auditor',
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

  const nvdaAdapter = new NvdaAdapter();
  const auditSession = new AuditSession();

  const registry = new ToolRegistry();
  registry.register(createNvdaTools(nvdaAdapter));
  registry.register(createSetupTools(nvdaAdapter));
  registry.register(createAuditTools(auditSession));
  registry.register(createReportTools(auditSession));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: registry.listTools(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return registry.callTool(name, (args as Record<string, unknown>) ?? {});
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: listNvdaPrompts(),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const messages = getNvdaPromptMessages(
      name,
      (args as Record<string, string | undefined>) ?? {},
    );
    return {
      description: `NVDA audit prompt: ${name}`,
      messages,
    };
  });

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
};
