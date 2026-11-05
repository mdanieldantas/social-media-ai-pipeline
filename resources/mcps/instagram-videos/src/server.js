import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { collectVideos } from './collect.js';

const server = new McpServer({ name: 'instagram-videos', version: '1.0.0' });
server.registerTool('atualizar_videos_instagram', {
  description: 'Coleta vídeos pelos endpoints web anônimos do Instagram e mescla em resources/videos/<conta>/lista.csv. Pode retornar coleta parcial por bloqueio ou métricas ausentes. Não exige login.',
  inputSchema: {
    conta: z.string().describe('Nome de usuário público, com ou sem @.'),
    maxPaginas: z.number().int().min(0).default(0).describe('Máximo de páginas obtidas; 0 percorre até o fim ou até não haver acesso/cursor disponível.'),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
}, async args => {
  try {
    const result = await collectVideos(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: error.message }] };
  }
});

await server.connect(new StdioServerTransport());
