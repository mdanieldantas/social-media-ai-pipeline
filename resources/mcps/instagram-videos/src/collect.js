import { mkdir, readFile, writeFile, rename, unlink, open, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { InstagramPublicClient, normalizeAccount, videoRows } from './instagram.js';
import { encodeCsv, decodeCsv, mergeRows } from './csv.js';

export const DEFAULT_OUTPUT_ROOT = fileURLToPath(new URL('../../../videos/', import.meta.url));

export async function collectVideos({ conta, maxPaginas = 0 }, {
  client = new InstagramPublicClient(), outputRoot = DEFAULT_OUTPUT_ROOT,
} = {}) {
  const account = normalizeAccount(conta);
  if (!Number.isSafeInteger(maxPaginas) || maxPaginas < 0) throw new Error('maxPaginas deve ser um inteiro >= 0.');
  const directory = path.join(outputRoot, account);
  await mkdir(directory, { recursive: true });
  if ((await lstat(directory)).isSymbolicLink()) throw new Error('A pasta da conta não pode ser um link simbólico.');
  const lockPath = path.join(directory, '.coleta.lock');
  let lock;
  try { lock = await open(lockPath, 'wx'); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Já existe uma coleta para esta conta. Se houve interrupção, remova .coleta.lock antes de repetir.');
    throw error;
  }
  try {
    return await collectLocked();
  } finally {
    await lock.close();
    await unlink(lockPath);
  }

  async function collectLocked() {
    const csvPath = path.join(directory, 'lista.csv');
    let existing = [];
    try { existing = decodeCsv(await readFile(csvPath, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    let rows = existing;
    const known = new Set(existing.map(row => row.id));
    const seen = new Set();
    const warnings = [];
    let pages = 0, complete = false, reason = 'acesso_indisponivel';
    let profile;

    async function persist() {
      const temporary = path.join(directory, `lista.${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, encodeCsv(rows), { encoding: 'utf8', flag: 'wx' });
        await rename(temporary, csvPath);
      } finally {
        await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
      }
    }

    async function consume(posts, source) {
      const incoming = [];
      for (const post of posts) {
        try {
          const videos = videoRows(post, account, new Date().toISOString());
          for (const video of videos) { seen.add(video.id); incoming.push(video); }
        } catch (error) { warnings.push(`${source}: item ignorado: ${error.message}`); }
      }
      rows = mergeRows(rows, incoming);
      // Checkpoint por página: uma falha posterior não perde as páginas já obtidas.
      await persist();
    }

    try { profile = await client.profile(account); }
    catch (error) { warnings.push(`perfil: ${error.message}`); }
    if (profile) {
      if (profile.is_private) {
        warnings.push('Conta privada: não é possível consultar os vídeos sem autenticação.');
        reason = 'conta_privada';
      } else {
        const timeline = profile.edge_owner_to_timeline_media;
        if (Array.isArray(timeline?.edges)) {
          pages++;
          await consume(timeline.edges.map(edge => edge.node), 'perfil');
          complete = timeline.page_info?.has_next_page === false;
        }
        if (!complete) {
          for (const source of ['feed', 'graphql']) {
            let cursor = source === 'graphql' ? timeline?.page_info?.end_cursor : undefined;
            const cursors = new Set();
            while (!maxPaginas || pages < maxPaginas) {
              const key = cursor ?? '<inicio>';
              if (cursors.has(key)) { warnings.push(`${source}: cursor repetido; paginação interrompida.`); break; }
              cursors.add(key);
              let page;
              try { page = await client[source](profile.id, cursor); }
              catch (error) { warnings.push(`${source}: ${error.message}`); break; }
              pages++;
              await consume(page.posts, source);
              if (!page.hasNext) { complete = true; break; }
              if (!page.cursor) { warnings.push(`${source}: próxima página anunciada sem cursor.`); break; }
              cursor = String(page.cursor);
            }
            if (complete || (maxPaginas && pages >= maxPaginas)) break;
          }
        }
        reason = complete ? 'fim_da_paginacao' : maxPaginas && pages >= maxPaginas ? 'limite_de_paginas' : 'acesso_ou_paginacao_interrompida';
      }
    }
    await persist();
    return {
      conta: account, arquivo: csvPath, paginasObtidas: pages,
      videosObtidos: seen.size, novosVideos: [...seen].filter(id => !known.has(id)).length,
      totalSalvo: rows.length, paginacaoConcluida: complete, motivo: reason, avisos: warnings,
    };
  }
}
