// HTTP nativo para OpenAI e OpenRouter, sem cache de credenciais.
import fs from "node:fs";
import path from "node:path";
import { transcriptionConfig } from "./env.js";

export async function transcribeAudioFile(audioPath) {
  const { provider, apiKey, model, url } = transcriptionConfig();
  const audio = await fs.promises.readFile(audioPath);
  const headers = { Authorization: `Bearer ${apiKey}` };
  let body;
  if (provider === "openrouter") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ model, input_audio: {
      data: audio.toString("base64"), format: path.extname(audioPath).slice(1)
    }, response_format: "json" });
  } else {
    body = new FormData();
    body.append("file", new Blob([audio]), path.basename(audioPath));
    body.append("model", model);
    body.append("response_format", "json");
  }
  let response;
  try {
    response = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(120_000) });
  } catch (error) {
    throw new Error(`Falha de conexao com ${provider} (${error.cause?.code || error.name}). Verifique rede, proxy e firewall.`);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    // Mensagens remotas podem conter credenciais: mostrar apenas codigos conhecidos.
    const rawCode = payload.error?.code || payload.error?.type;
    const code = ["credit_balance_exhausted", "insufficient_quota", "invalid_api_key", "rate_limit_exceeded"].includes(rawCode) ? rawCode : "erro_api";
    const hint = ["credit_balance_exhausted", "insufficient_quota"].includes(code)
      ? " Adicione creditos na conta do provedor."
      : response.status === 401 ? " Verifique a chave do provedor selecionado." : "";
    throw new Error(`${provider}: HTTP ${response.status} (${code}).${hint}`);
  }
  const result = await response.json();
  if (typeof result.text !== "string") throw new Error(`${provider}: resposta sem o campo text.`);
  return result.text;
}
