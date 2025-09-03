#!/usr/bin/env node
/**
 * Generic MCP client runner (no Claude required)
 *
 * Usage examples:
 *   1) List tools from a given MCP server executable
 *      FIRECRAWL_API_KEY=... \
 *      FIRECRAWL_MCP_COMMAND="firecrawl-mcp" \
 *      node scripts/mcp/run-mcp-tool.js --list
 *
 *   2) Call a specific tool with params from a JSON file
 *      FIRECRAWL_API_KEY=... \
 *      FIRECRAWL_MCP_COMMAND="firecrawl-mcp" \
 *      node scripts/mcp/run-mcp-tool.js \
 *        --tool firecrawl_extract \
 *        --params ./data/firecrawl-params.json
 *
 * Notes:
 * - This script uses @modelcontextprotocol/sdk to spawn an MCP server via stdio.
 * - It will pass through environment variables (e.g. FIRECRAWL_API_KEY) to the child process.
 * - You can override the command/args via env or CLI flags.
 */

const fs = require('fs');
const path = require('path');

// Lazy require CJS build to avoid ESM config friction
const { Client } = require('@modelcontextprotocol/sdk/dist/cjs/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/dist/cjs/client/stdio.js');

function parseArgs(argv) {
  const args = { _raw: argv.slice(2) };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const n = argv[i + 1];
    if (a === '--list') args.list = true;
    if (a === '--tool') args.tool = n;
    if (a === '--params') args.params = n;
    if (a === '--command') args.command = n;
    if (a === '--args') args.args = n; // JSON array string
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  const command = args.command || process.env.FIRECRAWL_MCP_COMMAND;
  const argsJson = args.args || process.env.FIRECRAWL_MCP_ARGS;
  const childArgs = argsJson ? JSON.parse(argsJson) : [];

  if (!command) {
    console.error('Missing MCP command. Set FIRECRAWL_MCP_COMMAND env or pass --command.');
    process.exit(2);
  }

  const transport = new StdioClientTransport({
    command,
    args: childArgs,
    env: {
      // Forward Firecrawl credentials if set
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
      FIRECRAWL_BASE_URL: process.env.FIRECRAWL_BASE_URL,
      // Keep PATH and other safe defaults via SDK (it merges defaults + this env)
    },
    stderr: 'pipe',
  });

  const client = new Client({ name: 'LocalMCPClient', version: '1.0.0' });
  await client.connect(transport);

  // List tools
  const list = await client.request(
    { method: 'tools/list' },
    require('@modelcontextprotocol/sdk/dist/cjs/types.js').ListToolsResultSchema
  );

  if (args.list || (!args.tool && !args.params)) {
    console.log(JSON.stringify(list, null, 2));
    await client.close();
    return;
  }

  // Resolve tool + params
  const toolName = args.tool;
  if (!toolName) {
    console.error('Missing --tool <name>');
    process.exit(2);
  }

  const toolFound = list.tools.find(t => t.name === toolName);
  if (!toolFound) {
    console.error(`Tool not found: ${toolName}`);
    console.error('Available tools:', list.tools.map(t => t.name));
    process.exit(2);
  }

  let params = {};
  if (args.params) {
    const p = path.resolve(args.params);
    params = JSON.parse(fs.readFileSync(p, 'utf-8'));
  }

  const callResult = await client.request(
    { method: 'tools/call', params: { name: toolName, arguments: params } },
    require('@modelcontextprotocol/sdk/dist/cjs/types.js').CallToolResultSchema
  );

  console.log(JSON.stringify(callResult, null, 2));

  await client.close();
}

main().catch(err => {
  console.error('MCP client error:', err);
  process.exit(1);
});

