import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP stdio negocia protocolo, lista ferramenta e retorna erro de validação', async () => {
  const client = new Client({ name: 'integration-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../src/server.js', import.meta.url))],
    stderr: 'pipe',
  });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 1);
    assert.equal(tools[0].name, 'atualizar_videos_instagram');
    assert.ok(tools[0].inputSchema.properties.conta);
    const response = await client.callTool({ name: tools[0].name, arguments: { conta: '../escape' } });
    assert.equal(response.isError, true);
    assert.match(response.content[0].text, /Conta inválida/);
  } finally {
    await client.close();
  }
});
