// Leitura, escrita e merge do CSV de vídeos.
import { promises as fs } from "node:fs";
import path from "node:path";

export const CSV_COLUMNS = [
  "shortcode",
  "url",
  "type",
  "taken_at",
  "timestamp",
  "views",
  "likes",
  "comments",
  "duration",
  "caption",
  "thumbnail",
];

function escapeField(value) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Mantém o CSV em uma linha por registro: normaliza quebras de linha.
  s = s.replace(/\r\n|\r|\n/g, " ");
  if (/[",]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCsv(videos) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const v of videos) {
    lines.push(CSV_COLUMNS.map((c) => escapeField(v[c])).join(","));
  }
  return lines.join("\n") + "\n";
}

// Parser de CSV que respeita campos entre aspas.
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      // ignora linhas totalmente vazias
      if (!(row.length === 1 && row[0] === "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
  }
  return rows;
}

export async function readExisting(csvPath) {
  let text;
  try {
    text = await fs.readFile(csvPath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rec = {};
    header.forEach((col, idx) => {
      rec[col] = row[idx] ?? "";
    });
    // normaliza tipos numéricos usados na ordenação/merge
    rec.timestamp = rec.timestamp ? Number(rec.timestamp) : 0;
    out.push(rec);
  }
  return out;
}

// Faz o merge: novos vídeos entram, os já existentes têm suas métricas
// atualizadas, e o resultado fica ordenado do mais novo para o mais antigo
// (os mais recentes no início).
export function mergeVideos(existing, fresh) {
  const byShortcode = new Map();
  for (const v of existing) {
    if (v.shortcode) byShortcode.set(v.shortcode, v);
  }
  let added = 0;
  let updated = 0;
  for (const v of fresh) {
    if (!v.shortcode) continue;
    if (byShortcode.has(v.shortcode)) updated++;
    else added++;
    byShortcode.set(v.shortcode, { ...byShortcode.get(v.shortcode), ...v });
  }
  const merged = Array.from(byShortcode.values());
  merged.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  return { merged, added, updated };
}

export async function writeCsv(csvPath, videos) {
  await fs.mkdir(path.dirname(csvPath), { recursive: true });
  await fs.writeFile(csvPath, toCsv(videos), "utf8");
}
