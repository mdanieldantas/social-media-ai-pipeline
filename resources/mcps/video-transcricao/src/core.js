// Lógica principal: extrai o áudio de cada vídeo, transcreve via OpenAI
// (dividindo em partes se passar do limite de tamanho) e salva o texto limpo
// em um .txt ao lado do próprio vídeo.
import fs from "node:fs";
import path from "node:path";
import {
  makeTempDir,
  cleanupDir,
  extractAudio,
  splitAudio,
  fileSize,
  MAX_BYTES,
} from "./audio.js";
import { transcribeAudioFile } from "./openai.js";

const VIDEO_EXTS = new Set([
  ".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v",
  ".flv", ".wmv", ".mpg", ".mpeg", ".3gp", ".ts", ".m2ts",
]);

export function isVideoFile(p) {
  return VIDEO_EXTS.has(path.extname(p).toLowerCase());
}

// .txt ao lado do vídeo, mesmo nome base.
export function txtPathFor(videoPath) {
  const dir = path.dirname(videoPath);
  const base = path.basename(videoPath, path.extname(videoPath));
  return path.join(dir, `${base}.txt`);
}

// Lista vídeos de uma pasta (opcionalmente recursivo).
export function listVideos(dir, recursive) {
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (recursive) walk(full);
      } else if (entry.isFile() && isVideoFile(full)) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out.sort();
}

// Normaliza o texto: junta partes e tira espaços/linhas em branco nas pontas.
function cleanText(parts) {
  return parts
    .map((t) => (t || "").trim())
    .filter((t) => t.length > 0)
    .join("\n")
    .trim();
}

// Transcreve um único vídeo. Nunca depende de estado externo; devolve um
// objeto de resultado descrevendo o que aconteceu.
export async function transcribeVideo(videoPath, { force = false, onLog = () => {} } = {}) {
  const absVideo = path.resolve(videoPath);
  if (!fs.existsSync(absVideo)) {
    throw new Error(`Vídeo não encontrado: ${absVideo}`);
  }
  if (!isVideoFile(absVideo)) {
    throw new Error(`O arquivo não parece ser um vídeo suportado: ${absVideo}`);
  }

  const txtPath = txtPathFor(absVideo);
  if (!force && fs.existsSync(txtPath)) {
    onLog(`Pulado (já transcrito): ${path.basename(absVideo)}`);
    return { status: "pulado", video: absVideo, txt: txtPath };
  }

  const tmp = makeTempDir();
  try {
    onLog(`Extraindo áudio: ${path.basename(absVideo)}`);
    const audioPath = await extractAudio(absVideo, tmp);

    let texto;
    if (fileSize(audioPath) <= MAX_BYTES) {
      texto = await transcribeAudioFile(audioPath);
    } else {
      onLog(
        `Áudio acima do limite da API; dividindo em partes: ${path.basename(absVideo)}`
      );
      const parts = await splitAudio(audioPath, tmp);
      const textos = [];
      for (let i = 0; i < parts.length; i++) {
        onLog(`Transcrevendo parte ${i + 1}/${parts.length}...`);
        textos.push(await transcribeAudioFile(parts[i]));
      }
      texto = textos.join("\n");
    }

    const limpo = cleanText([texto]);
    fs.writeFileSync(txtPath, limpo + "\n", "utf8");
    onLog(`Transcrito -> ${path.basename(txtPath)}`);
    return { status: "transcrito", video: absVideo, txt: txtPath, caracteres: limpo.length };
  } finally {
    cleanupDir(tmp);
  }
}

// Transcreve todos os vídeos de uma pasta. Erros em um vídeo não interrompem
// os demais.
export async function transcribeFolder(dir, { force = false, recursive = false, onLog = () => {} } = {}) {
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
    throw new Error(`Pasta não encontrada: ${absDir}`);
  }

  const videos = listVideos(absDir, recursive);
  onLog(`Encontrados ${videos.length} vídeo(s) em ${absDir}.`);

  const transcritos = [];
  const pulados = [];
  const erros = [];

  for (const v of videos) {
    try {
      const r = await transcribeVideo(v, { force, onLog });
      if (r.status === "pulado") pulados.push(r);
      else transcritos.push(r);
    } catch (err) {
      onLog(`Erro ignorado em ${path.basename(v)}: ${err.message}`);
      erros.push({ video: v, erro: err.message });
    }
  }

  return {
    pasta: absDir,
    recursivo: recursive,
    total: videos.length,
    transcritos,
    pulados,
    erros,
  };
}
