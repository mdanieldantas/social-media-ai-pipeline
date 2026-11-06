// Carrega variáveis de ambiente a partir de um arquivo .env na raiz do projeto
// e oferece um acesso claro à chave da OpenAI. A "raiz do projeto" é descoberta
// subindo a árvore de diretórios a partir deste arquivo até encontrar um .env
// (com fallback para o diretório de trabalho atual do processo).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Procura o .env subindo a partir da pasta do MCP; se não achar, usa o cwd.
function findEnvFile() {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const cwdEnv = path.join(process.cwd(), ".env");
  return fs.existsSync(cwdEnv) ? cwdEnv : null;
}

const envPath = findEnvFile();
if (envPath) dotenv.config({ path: envPath });

export const ENV_FILE_PATH = envPath;

// Lança um erro com mensagem clara quando a chave não está configurada.
export function transcribeProvider() {
  const provider = (process.env.TRANSCRIBE_PROVIDER ||
    (process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY ? "openrouter" : "openai")).trim().toLowerCase();
  if (!["openai", "openrouter"].includes(provider)) throw new Error("TRANSCRIBE_PROVIDER deve ser openai ou openrouter.");
  return provider;
}

export function transcribeModel() {
  return transcribeProvider() === "openrouter"
    ? (process.env.OPENROUTER_TRANSCRIBE_MODEL || "openai/whisper-1").trim()
    : (process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1").trim();
}

export function transcriptionConfig() {
  const provider = transcribeProvider();
  const variable = provider === "openrouter" ? "OPENROUTER_API_KEY" : "OPENAI_API_KEY";
  const apiKey = (process.env[variable] || "").trim();
  if (!apiKey) throw new Error(`Configure ${variable} no arquivo ${envPath || ".env"} e reinicie o MCP.`);
  return { provider, apiKey, model: transcribeModel(), url: provider === "openrouter"
    ? "https://openrouter.ai/api/v1/audio/transcriptions"
    : "https://api.openai.com/v1/audio/transcriptions" };
}
