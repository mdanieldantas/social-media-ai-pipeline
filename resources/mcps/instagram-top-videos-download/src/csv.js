// Leitura do CSV de vídeos e ordenação por curtidas.
import { promises as fs } from "node:fs";

// Parser de CSV que respeita campos entre aspas (mesma estratégia do MCP
// instagram-videos que gerou o arquivo).
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

// Lê o CSV e devolve a lista de vídeos como objetos { shortcode, likes, ... }.
export async function readVideos(csvPath) {
  const text = await fs.readFile(csvPath, "utf8");
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
    out.push(rec);
  }
  return out;
}

// Ordena os vídeos da maior para a menor quantidade de curtidas (coluna likes).
// As visualizações são ignoradas para fins de ordenação.
export function sortByLikes(videos) {
  return [...videos].sort(
    (a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0)
  );
}
