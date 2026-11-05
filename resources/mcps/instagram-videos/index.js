#!/usr/bin/env node
// MCP server: coleta os vídeos de uma conta pública do Instagram e salva em
// resources/videos/<conta>/lista.csv (mais novos primeiro).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { fetchAccountVideos } from "./src/instagram.js";
import { readExisting, mergeVideos, writeCsv } from "./src/csv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base de saída: <raiz-do-projeto>/resources/videos
// (a partir de resources/mcps/instagram-videos sobem-se 2 níveis).
// Pode ser sobrescrita pela env OUTPUT_DIR.
const OUTPUT_BASE =
  process.env.OUTPUT_DIR || path.resolve(__dirname, "..", "..", "videos");

function csvPathFor(username) {
  return path.join(OUTPUT_BASE, username, "lista.csv");
}

async function runForAccount(username, maxPages) {
  const logs = [];
  const onLog = (m) => logs.push(m);

  const result = await fetchAccountVideos(username, { maxPages, onLog });
  const csvPath = csvPathFor(username);
  const existing = await readExisting(csvPath);
  const { merged, added, updated } = mergeVideos(existing, result.videos);
  await writeCsv(csvPath, merged);

  return {
    username,
    userId: result.userId,
    totalMediaNaConta: result.totalMedia,
    videosColetadosNestaExecucao: result.videos.length,
    novosAdicionados: added,
    atualizados: updated,
    totalNoArquivo: merged.length,
    paginasPercorridas: result.pagesFetched,
    erros: result.errors,
    arquivo: csvPath,
    logs,
  };
}

const server = new McpServer({
  name: "instagram-videos",
  version: "1.0.0",
});

server.registerTool(
  "fetch_account_videos",
  {
    title: "Coletar vídeos de uma conta do Instagram",
    description:
      "Acessa a API pública (web) do Instagram, sem autenticação, e coleta " +
      "todos os vídeos de uma conta com informações básicas + visualizações " +
      "e curtidas. Percorre o máximo de páginas possível e ignora erros de " +
      "acesso, guardando o que conseguir. Salva/atualiza " +
      "resources/videos/<conta>/lista.csv (mais novos primeiro).",
    inputSchema: {
      username: z
        .string()
        .min(1)
        .describe("Nome de usuário (@) da conta pública do Instagram."),
      maxPages: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Limite opcional de páginas a percorrer (padrão: todas)."),
    },
  },
  async ({ username, maxPages }) => {
    const clean = String(username).trim().replace(/^@/, "");
    try {
      const summary = await runForAccount(clean, maxPages ?? Infinity);
      return {
        content: [
          {
            type: "text",
            text:
              `Conta @${summary.username}: ${summary.videosColetadosNestaExecucao} vídeos coletados ` +
              `(${summary.novosAdicionados} novos, ${summary.atualizados} atualizados). ` +
              `Total no arquivo: ${summary.totalNoArquivo}. ` +
              `Páginas percorridas: ${summary.paginasPercorridas}. ` +
              `Erros ignorados: ${summary.erros.length}.\n` +
              `Arquivo: ${summary.arquivo}\n\n` +
              JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Falha ao coletar vídeos de @${clean}: ${err.message}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr para não poluir o protocolo (stdout) do MCP.
console.error("instagram-videos MCP rodando em stdio.");
