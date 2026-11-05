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
export function requireOpenAIKey() {
  const key = (process.env.OPENAI_API_KEY || "").trim();
  if (!key) {
    const ondeProcurou = envPath
      ? `Foi lido o arquivo: ${envPath}, mas ele não define OPENAI_API_KEY.`
      : `Nenhum arquivo .env foi encontrado na raiz do projeto.`;
    throw new Error(
      "A chave da OpenAI não está configurada. " +
        ondeProcurou +
        " Crie (ou edite) um arquivo .env na raiz do projeto com a linha:\n" +
        "OPENAI_API_KEY=sk-...\n" +
        "Depois reinicie o MCP para que a variável seja carregada."
    );
  }
  return key;
}

// Modelo de transcrição configurável; padrão whisper-1 (amplamente disponível
// e aceita resposta em texto puro).
export function transcribeModel() {
  return (process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1").trim();
}
