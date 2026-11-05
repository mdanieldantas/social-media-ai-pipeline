// Resolve a URL do arquivo de vídeo (.mp4) a partir do shortcode e faz o
// download, usando apenas o GraphQL público (web) do Instagram — sem login,
// cookies ou tokens.
//
// Estratégia (não exige autenticação e não cai em "login wall"):
//   GET https://www.instagram.com/graphql/query
//     ?doc_id=10015901848480474
//     &variables={"shortcode":"<shortcode>"}   (URL-encoded)
//   Headers de navegador, incluindo x-ig-app-id: 936619743392459.
//   A URL fica em data.xdt_shortcode_media.video_url.

import { promises as fs } from "node:fs";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";

const WEB_APP_ID = "936619743392459";
const GRAPHQL_DOC_ID = "10015901848480474";
const GRAPHQL_URL = "https://www.instagram.com/graphql/query";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "x-ig-app-id": WEB_APP_ID,
  "X-Requested-With": "XMLHttpRequest",
};

// Resolve a video_url pública a partir do shortcode.
export async function resolveVideoUrl(shortcode) {
  const variables = JSON.stringify({ shortcode });
  const url =
    `${GRAPHQL_URL}?doc_id=${encodeURIComponent(GRAPHQL_DOC_ID)}` +
    `&variables=${encodeURIComponent(variables)}`;

  const res = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      Referer: `https://www.instagram.com/reel/${shortcode}/`,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Resposta não é JSON (possível bloqueio/login wall).");
  }

  const media = json?.data?.xdt_shortcode_media;
  if (!media) {
    throw new Error("xdt_shortcode_media ausente na resposta.");
  }
  const videoUrl = media.video_url;
  if (!videoUrl) {
    throw new Error("video_url ausente (a mídia pode não ser um vídeo).");
  }
  return videoUrl;
}

// Baixa o arquivo de vídeo da URL informada para destPath.
export async function downloadVideo(videoUrl, destPath) {
  const res = await fetch(videoUrl, {
    headers: {
      "User-Agent": BROWSER_HEADERS["User-Agent"],
      Accept: "*/*",
      Referer: "https://www.instagram.com/",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  if (!res.body) {
    throw new Error("Resposta sem corpo ao baixar o vídeo.");
  }
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
}
