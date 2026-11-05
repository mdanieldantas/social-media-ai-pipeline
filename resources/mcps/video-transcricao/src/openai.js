// Transcrição via API da OpenAI. Recebe um caminho de arquivo de áudio e
// devolve apenas o texto falado (response_format: text), sem metadados.
import fs from "node:fs";
import OpenAI from "openai";
import { requireOpenAIKey, transcribeModel } from "./env.js";

let client = null;

function getClient() {
  if (!client) {
    const apiKey = requireOpenAIKey();
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function transcribeAudioFile(audioPath) {
  const openai = getClient();
  const resp = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: transcribeModel(),
    response_format: "text",
  });
  // Com response_format "text" o SDK devolve a string diretamente.
  return typeof resp === "string" ? resp : resp?.text ?? "";
}
