import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const main = async (): Promise<void> => {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('virtual-screen-reader-auditor MCP server running on stdio');
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
