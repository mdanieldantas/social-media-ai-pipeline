#!/usr/bin/env node
// MCP server: lê o CSV de vídeos de uma conta do Instagram (gerado pelo MCP
// instagram-videos), ordena os vídeos por curtidas (likes, do maior para o
// menor) e baixa os N mais curtidos. A URL do .mp4 não está no CSV: ela é
// resolvida online a partir do shortcode via GraphQL público (sem auth).
// Os arquivos são salvos na pasta da conta (a pasta que contém o CSV) com o
// nome "<ordem>_<shortcode>.mp4".
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { readVideos, sortByLikes } from "./src/csv.js";
import { resolveVideoUrl, downloadVideo } from "./src/instagram.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A conta é identificada pela pasta que contém o CSV (ex.: .../videos/<conta>/lista.csv).
function accountFromCsvPath(csvPath) {
  const dir = path.dirname(path.resolve(csvPath));
  return { account: path.basename(dir), accountDir: dir };
}

async function run(csvPath, count, onLog) {
  const absCsv = path.resolve(csvPath);
  const { account, accountDir } = accountFromCsvPath(absCsv);
  onLog(`Conta identificada pelo CSV: @${account} (pasta: ${accountDir}).`);

  const videos = await readVideos(absCsv);
  onLog(`CSV lido: ${videos.length} vídeos.`);

  const ordered = sortByLikes(videos).filter((v) => v.shortcode);
  const toDownload = ordered.slice(0, count);
  onLog(
    `Ordenados por curtidas. Baixando os ${toDownload.length} mais curtidos ` +
      `(solicitados: ${count}).`
  );

  const baixados = [];
  const erros = [];

  for (let i = 0; i < toDownload.length; i++) {
    const ordem = i + 1;
    const v = toDownload[i];
    const fileName = `${ordem}_${v.shortcode}.mp4`;
    const destPath = path.join(accountDir, fileName);
    try {
      const videoUrl = await resolveVideoUrl(v.shortcode);
      await downloadVideo(videoUrl, destPath);
      baixados.push({ ordem, shortcode: v.shortcode, likes: Number(v.likes) || 0, arquivo: destPath });
      onLog(`#${ordem} ${v.shortcode} (${v.likes} curtidas) -> ${fileName}`);
    } catch (err) {
      // Requisito: ignorar o erro e prosseguir com os próximos vídeos.
      erros.push({ ordem, shortcode: v.shortcode, erro: err.message });
      onLog(`#${ordem} ${v.shortcode}: erro ignorado — ${err.message}`);
    }
    // Pequena pausa para ser educado com a API pública.
    if (i < toDownload.length - 1) await sleep(800);
  }

  return {
    conta: account,
    pasta: accountDir,
    csv: absCsv,
    totalNoCsv: videos.length,
    solicitados: count,
    selecionados: toDownload.length,
    baixados,
    erros,
  };
}

const server = new McpServer({
  name: "instagram-top-videos-download",
  version: "1.0.0",
});

server.registerTool(
  "download_top_videos",
  {
    title: "Baixar os vídeos mais curtidos de uma conta do Instagram",
    description:
      "Lê um CSV de vídeos de uma conta do Instagram (caminho flexível), " +
      "ordena pela coluna 'likes' (do mais curtido para o menos curtido, " +
      "ignorando as visualizações) e baixa os N primeiros. A URL do .mp4 não " +
      "está no CSV: é resolvida online a partir do 'shortcode' via GraphQL " +
      "público do Instagram (sem login/cookies/tokens). Erros de acesso ou " +
      "download são ignorados, baixando apenas os vídeos possíveis. Os " +
      "arquivos são salvos na pasta da conta (a que contém o CSV) com o nome " +
      "'<ordem>_<shortcode>.mp4'.",
    inputSchema: {
      csvPath: z
        .string()
        .min(1)
        .describe(
          "Caminho (absoluto ou relativo) para o CSV de vídeos da conta. A " +
            "conta é identificada pela pasta que contém o arquivo."
        ),
      count: z
        .number()
        .int()
        .positive()
        .describe("Quantidade de vídeos a baixar, começando pelos mais curtidos."),
    },
  },
  async ({ csvPath, count }) => {
    const logs = [];
    const onLog = (m) => logs.push(m);
    try {
      const summary = await run(csvPath, count, onLog);
      return {
        content: [
          {
            type: "text",
            text:
              `Conta @${summary.conta}: ${summary.baixados.length} vídeo(s) baixado(s) ` +
              `de ${summary.selecionados} selecionado(s) (${summary.erros.length} erro(s) ignorado(s)). ` +
              `Pasta: ${summary.pasta}\n\n` +
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
            text: `Falha ao processar o CSV "${csvPath}": ${err.message}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("instagram-top-videos-download MCP rodando em stdio.");
