import type { Prompt } from '@modelcontextprotocol/sdk/types.js';

export interface PromptDefinition {
  readonly prompt: Prompt;
  readonly getMessage: (
    args: Record<string, string | undefined>,
  ) => { role: 'user'; content: { type: 'text'; text: string } }[];
}

export function listPrompts(prompts: ReadonlyMap<string, PromptDefinition>): Prompt[] {
  return [...prompts.values()].map((p) => p.prompt);
}

export function getPromptMessages(
  name: string,
  args: Record<string, string | undefined>,
  prompts: ReadonlyMap<string, PromptDefinition>,
): { role: 'user'; content: { type: 'text'; text: string } }[] {
  const definition = prompts.get(name);
  if (!definition) {
    throw new Error(`Unknown prompt: ${name}. Available: ${[...prompts.keys()].join(', ')}`);
  }
  return definition.getMessage(args);
}
