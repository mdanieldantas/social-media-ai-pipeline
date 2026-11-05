// Extração e preparação de áudio usando um ffmpeg/ffprobe portáveis (binários
// estáticos baixados via npm), sem depender de instalação no sistema.
//
// Estratégia de tamanho: o áudio é reencodado em Opus mono 16 kHz a ~16 kbps,
// otimizado para voz (application=voip). Isso mantém a fala clara e produz
// arquivos minúsculos (~7 MB por hora), o que por si só já evita o limite de
// 25 MB da OpenAI na grande maioria dos casos. Como rede de segurança, se ainda
// assim o áudio passar do limite, ele é dividido em partes por tempo.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
if (ffprobeStatic && ffprobeStatic.path) ffmpeg.setFfprobePath(ffprobeStatic.path);

// Limite de 25 MB da API; usamos uma margem de segurança.
export const MAX_BYTES = 24 * 1024 * 1024;

const AUDIO_EXT = "ogg";

export function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "video-transcricao-"));
}

export function cleanupDir(dir) {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Extrai o áudio do vídeo para um Opus/OGG mono comprimido, focado em fala.
export function extractAudio(videoPath, outDir) {
  const outPath = path.join(outDir, `audio.${AUDIO_EXT}`);
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec("libopus")
      .audioBitrate("16k")
      .outputOptions(["-application", "voip", "-vbr", "on"])
      .format("ogg")
      .on("error", (err) =>
        reject(new Error(`Falha ao extrair áudio: ${err.message}`))
      )
      .on("end", () => resolve(outPath))
      .save(outPath);
  });
}

export function fileSize(p) {
  return fs.statSync(p).size;
}

// Duração em segundos via ffprobe.
export function getDurationSeconds(p) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(p, (err, data) => {
      if (err) return reject(new Error(`Falha ao ler duração: ${err.message}`));
      const dur = data?.format?.duration;
      if (!dur || Number.isNaN(Number(dur))) {
        return reject(new Error("Não foi possível determinar a duração do áudio."));
      }
      resolve(Number(dur));
    });
  });
}

// Divide o áudio (já comprimido) em partes por tempo, cada uma abaixo do limite.
// Retorna a lista de caminhos das partes, em ordem.
export async function splitAudio(audioPath, outDir) {
  const size = fileSize(audioPath);
  const duration = await getDurationSeconds(audioPath);

  // Quantas partes são necessárias para ficar abaixo do limite (com folga).
  const numParts = Math.max(2, Math.ceil(size / MAX_BYTES));
  const segmentTime = Math.ceil(duration / numParts);

  const pattern = path.join(outDir, `parte_%03d.${AUDIO_EXT}`);
  await new Promise((resolve, reject) => {
    ffmpeg(audioPath)
      .outputOptions([
        "-f", "segment",
        "-segment_time", String(segmentTime),
        "-c", "copy",
        "-reset_timestamps", "1",
      ])
      .on("error", (err) =>
        reject(new Error(`Falha ao dividir o áudio: ${err.message}`))
      )
      .on("end", () => resolve())
      .save(pattern);
  });

  const parts = fs
    .readdirSync(outDir)
    .filter((f) => /^parte_\d+\.ogg$/.test(f))
    .sort()
    .map((f) => path.join(outDir, f));

  if (parts.length === 0) {
    throw new Error("A divisão do áudio não gerou nenhuma parte.");
  }
  return parts;
}
