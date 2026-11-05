#!/usr/bin/env node
// MCP server: recebe arquivos de vídeo (um arquivo específico ou uma pasta
// inteira), extrai o áudio com compressão otimizada para fala usando um ffmpeg
// portável (binário estático, sem instalação no sistema) e gera a transcrição
// via API da OpenAI. Para cada vídeo, salva a transcrição limpa (apenas o texto
// falado, sem cabeçalho/metadados) em um .txt ao lado do próprio vídeo.
//
// A chave da OpenAI vem de um .env na raiz do projeto (OPENAI_API_KEY) e o MCP
// avisa de forma clara caso ela não esteja configurada. Áudios acima do limite
// de 25 MB da API são divididos em partes automaticamente. Em pastas, vídeos já
// transcritos são pulados (a menos que 'force' seja true) e erros em um vídeo
// não interrompem os demais.
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { requireOpenAIKey } from "./src/env.js";
import { transcribeVideo, transcribeFolder } from "./src/core.js";

function errorContent(err) {
  return {
    isError: true,
    content: [{ type: "text", text: err.message }],
  };
}

const server = new McpServer({
  name: "video-transcricao",
  version: "1.0.0",
});

server.registerTool(
  "transcrever_video",
  {
    title: "Transcrever um vídeo específico",
    description:
      "Extrai o áudio de um único arquivo de vídeo e gera a transcrição via " +
      "API da OpenAI, salvando o texto limpo em um .txt com o mesmo nome, na " +
      "mesma pasta do vídeo. Áudios acima do limite de tamanho da API são " +
      "divididos em partes automaticamente. Use 'force' para refazer uma " +
      "transcrição que já exista.",
    inputSchema: {
      videoPath: z
        .string()
        .min(1)
        .describe("Caminho (absoluto ou relativo) do arquivo de vídeo."),
      force: z
        .boolean()
        .optional()
        .describe("Se true, refaz a transcrição mesmo que o .txt já exista."),
    },
  },
  async ({ videoPath, force = false }) => {
    const logs = [];
    const onLog = (m) => logs.push(m);
    try {
      requireOpenAIKey();
      const r = await transcribeVideo(videoPath, { force, onLog });
      const resumo =
        r.status === "pulado"
          ? `Pulado (já existia): ${r.txt}`
          : `Transcrito: ${r.txt} (${r.caracteres} caracteres).`;
      return {
        content: [
          { type: "text", text: `${resumo}\n\n${JSON.stringify({ ...r, logs }, null, 2)}` },
        ],
      };
    } catch (err) {
      return errorContent(err);
    }
  }
);

server.registerTool(
  "transcrever_pasta",
  {
    title: "Transcrever todos os vídeos de uma pasta",
    description:
      "Percorre uma pasta, extrai o áudio de cada vídeo e gera as transcrições " +
      "via API da OpenAI, salvando cada texto limpo em um .txt ao lado do " +
      "respectivo vídeo. Vídeos já transcritos são pulados (use 'force' para " +
      "refazer todos). Erros em um vídeo específico são ignorados e o processo " +
      "continua com os demais. Use 'recursive' para incluir subpastas.",
    inputSchema: {
      folderPath: z
        .string()
        .min(1)
        .describe("Caminho (absoluto ou relativo) da pasta com os vídeos."),
      force: z
        .boolean()
        .optional()
        .describe("Se true, refaz a transcrição mesmo de vídeos já transcritos."),
      recursive: z
        .boolean()
        .optional()
        .describe("Se true, inclui também os vídeos das subpastas."),
    },
  },
  async ({ folderPath, force = false, recursive = false }) => {
    const logs = [];
    const onLog = (m) => logs.push(m);
    try {
      requireOpenAIKey();
      const summary = await transcribeFolder(folderPath, { force, recursive, onLog });
      const resumo =
        `Pasta ${summary.pasta}: ${summary.transcritos.length} transcrito(s), ` +
        `${summary.pulados.length} pulado(s), ${summary.erros.length} erro(s) ` +
        `de ${summary.total} vídeo(s).`;
      return {
        content: [
          { type: "text", text: `${resumo}\n\n${JSON.stringify({ ...summary, logs }, null, 2)}` },
        ],
      };
    } catch (err) {
      return errorContent(err);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("video-transcricao MCP rodando em stdio.");
