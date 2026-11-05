export const COLUMNS = [
  'id', 'conta', 'publicacao_id', 'shortcode', 'url', 'publicado_em',
  'legenda', 'visualizacoes', 'reproducoes', 'curtidas', 'comentarios',
  'duracao_segundos', 'video_url', 'thumbnail_url', 'coletado_em',
];

export function encodeCsv(rows) {
  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return '\uFEFF' + [COLUMNS, ...rows.map(row => COLUMNS.map(key => row[key]))]
    .map(row => row.map(escape).join(',')).join('\r\n') + '\r\n';
}

// CSV RFC 4180: legendas podem conter vírgulas, aspas e quebras de linha.
export function decodeCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const records = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else if (!quoted && field.length > 0) throw new Error('CSV inválido: aspas em campo não delimitado.');
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some(value => value !== '')) records.push(row);
      row = []; field = '';
    } else field += char;
  }
  if (quoted) throw new Error('CSV inválido: campo com aspas não fechado.');
  if (field || row.length) { row.push(field); records.push(row); }
  if (!records.length) return [];
  const header = records.shift();
  if (COLUMNS.some(column => !header.includes(column))) throw new Error('CSV existente tem cabeçalho incompatível.');
  return records.map(values => {
    if (values.length !== header.length) throw new Error('CSV existente contém linha incompleta.');
    const record = Object.fromEntries(header.map((key, index) => [key, values[index]]));
    if (!record.id) throw new Error('CSV existente contém vídeo sem ID.');
    return record;
  });
}

export function mergeRows(existing, incoming) {
  const records = new Map(existing.map(row => [String(row.id), row]));
  for (const row of incoming) {
    const previous = records.get(String(row.id)) ?? {};
    // Métrica ausente não apaga um valor obtido em execução anterior; zero é válido.
    const available = Object.fromEntries(Object.entries(row).filter(([, value]) => value !== '' && value != null));
    records.set(String(row.id), { ...previous, ...available });
  }
  return [...records.values()].sort((a, b) =>
    (Date.parse(b.publicado_em) || 0) - (Date.parse(a.publicado_em) || 0)
    || String(b.id).localeCompare(String(a.id)));
}
