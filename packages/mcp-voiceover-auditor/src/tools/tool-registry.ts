import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ToolCallResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolCallResult>;

export interface ToolModule {
  readonly tools: Tool[];
  readonly handlers: ReadonlyMap<string, ToolHandler>;
}

function jsonResult(data: unknown): ToolCallResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function textResult(text: string): ToolCallResult {
  return {
    content: [{ type: 'text', text }],
  };
}

function errorResult(tool: string, error: unknown): ToolCallResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message, tool }, null, 2) }],
    isError: true,
  };
}

export const result = {
  json: jsonResult,
  text: textResult,
  error: errorResult,
};

export class ToolRegistry {
  private readonly allTools: Tool[] = [];
  private readonly allHandlers = new Map<string, ToolHandler>();

  register(module: ToolModule): void {
    for (const tool of module.tools) {
      if (this.allHandlers.has(tool.name)) {
        throw new Error(`Duplicate tool name: ${tool.name}`);
      }
      this.allTools.push(tool);
    }

    for (const [name, handler] of module.handlers) {
      this.allHandlers.set(name, handler);
    }
  }

  listTools(): Tool[] {
    return [...this.allTools];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolCallResult> {
    const handler = this.allHandlers.get(name);
    if (!handler) {
      return result.error(name, new Error(`Unknown tool: ${name}`));
    }

    try {
      return await handler(args);
    } catch (error) {
      return result.error(name, error);
    }
  }
}
