import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { collectVideos, DEFAULT_OUTPUT_ROOT } from '../src/collect.js';
import { encodeCsv, decodeCsv } from '../src/csv.js';
import { normalizeAccount, InstagramPublicClient, videoRows } from '../src/instagram.js';

const post = (id, timestamp, extras = {}) => ({
  id, shortcode: `code${id}`, is_video: true, taken_at_timestamp: timestamp,
  edge_media_to_caption: { edges: [{ node: { text: 'Uma legenda, com "aspas"\ne outra linha' } }] },
  video_view_count: 10, edge_media_preview_like: { count: 0 }, ...extras,
});

async function fixture(t) {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), 'instagram-mcp-'));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  return { outputRoot, csv: path.join(outputRoot, 'exemplo', 'lista.csv') };
}

test('CSV preserva UTF-8, aspas, quebras de linha e métricas zeradas', () => {
  const rows = videoRows(post('1', 100), 'exemplo', '2026-01-01');
  const decoded = decodeCsv(encodeCsv(rows));
  assert.equal(decoded[0].legenda, rows[0].legenda);
  assert.equal(decoded[0].curtidas, '0');
  assert.throws(() => decodeCsv('id\n1'), /cabeçalho/);
});

test('paginação, checkpoint parcial, alternativa GraphQL e atualização sem duplicatas', async t => {
  const { outputRoot, csv } = await fixture(t);
  const client = {
    profile: async () => ({ id: '123', edge_owner_to_timeline_media: {
      edges: [{ node: post('2', 200) }], page_info: { has_next_page: true, end_cursor: 'profile-cursor' },
    } }),
    feed: async (_id, cursor) => {
      if (!cursor) return { posts: [post('1', 100)], hasNext: true, cursor: 'next' };
      assert.equal(decodeCsv(await readFile(csv, 'utf8')).length, 2);
      throw new Error('HTTP 403');
    },
    graphql: async (_id, cursor) => {
      assert.equal(cursor, 'profile-cursor');
      return { posts: [post('1', 100), post('3', 300)], hasNext: false };
    },
  };
  const first = await collectVideos({ conta: '@Exemplo' }, { client, outputRoot });
  assert.equal(first.novosVideos, 3);
  assert.equal(first.paginacaoConcluida, true);
  assert.match(first.avisos[0], /403/);
  assert.deepEqual(decodeCsv(await readFile(csv, 'utf8')).map(row => row.id), ['3', '2', '1']);
  client.profile = async () => ({ id: '123', edge_owner_to_timeline_media: {
    edges: [{ node: post('4', 400) }, { node: post('3', 300, { video_view_count: undefined, edge_media_preview_like: { count: 5 } }) }],
    page_info: { has_next_page: false },
  } });
  const second = await collectVideos({ conta: 'exemplo' }, { client, outputRoot });
  assert.equal(second.novosVideos, 1);
  const rows = decodeCsv(await readFile(csv, 'utf8'));
  assert.deepEqual(rows.map(row => row.id), ['4', '3', '2', '1']);
  assert.equal(rows[1].visualizacoes, '10');
  assert.equal(rows[1].curtidas, '5');
});

test('bloqueio de todas as fontes mantém a coleta parcial e o CSV anterior', async t => {
  const { outputRoot, csv } = await fixture(t);
  const fail = async () => { throw new Error('Acesso negado'); };
  const client = {
    profile: async () => ({ id: '123', edge_owner_to_timeline_media: {
      edges: [{ node: post('1', 100) }], page_info: { has_next_page: true },
    } }), feed: fail, graphql: fail,
  };
  const first = await collectVideos({ conta: 'exemplo' }, { client, outputRoot });
  assert.equal(first.paginacaoConcluida, false);
  assert.equal(first.totalSalvo, 1);
  const before = await readFile(csv, 'utf8');
  client.profile = async () => { const error = new Error('Rede indisponível'); error.code = 'ECONNRESET'; throw error; };
  const second = await collectVideos({ conta: 'exemplo' }, { client, outputRoot });
  assert.equal(second.totalSalvo, 1);
  assert.equal(await readFile(csv, 'utf8'), before);
});

test('cursor repetido e limite de páginas encerram a coleta', async t => {
  const { outputRoot } = await fixture(t);
  let calls = 0;
  const client = {
    profile: async () => ({ id: '123' }),
    feed: async () => { calls++; return { posts: [], hasNext: true, cursor: 'same' }; },
    graphql: async () => { throw new Error('bloqueado'); },
  };
  const result = await collectVideos({ conta: 'exemplo' }, { client, outputRoot });
  assert.equal(calls, 2);
  assert.ok(result.avisos.some(value => value.includes('cursor repetido')));
  calls = 0;
  const limited = await collectVideos({ conta: 'exemplo', maxPaginas: 1 }, { client, outputRoot });
  assert.equal(calls, 1);
  assert.equal(limited.motivo, 'limite_de_paginas');
});

test('contas inválidas são rejeitadas e caminho padrão independe do cwd', () => {
  for (const account of ['../escape', '.', 'a/b', 'con', 'a..b', 'a.', 'x'.repeat(31)]) {
    assert.throws(() => normalizeAccount(account));
  }
  assert.equal(normalizeAccount('@Conta_teste'), 'conta_teste');
  assert.equal(path.basename(path.normalize(DEFAULT_OUTPUT_ROOT)), 'videos');
});

test('carrossel inclui cada vídeo sem atribuir curtidas da publicação aos filhos', () => {
  const rows = videoRows(post('parent', 100, { is_video: false, like_count: 99, carousel_media: [
    { pk: 'v1', media_type: 2, play_count: 12 }, { pk: 'photo', media_type: 1 },
    { pk: 'v2', media_type: 2, view_count: 0 },
  ] }), 'exemplo', 'now');
  assert.deepEqual(rows.map(row => row.id), ['v1', 'v2']);
  assert.equal(rows[0].curtidas, '');
  assert.equal(rows[0].reproducoes, 12);
  assert.equal(rows[1].visualizacoes, 0);
});

test('CSV corrompido e bloqueio concorrente não são ignorados', async t => {
  const { outputRoot, csv } = await fixture(t);
  await mkdir(path.dirname(csv));
  await writeFile(csv, 'corrompido');
  await assert.rejects(collectVideos({ conta: 'exemplo' }, { outputRoot }), /cabeçalho/);
  assert.equal(await readFile(csv, 'utf8'), 'corrompido');
  await writeFile(path.join(path.dirname(csv), '.coleta.lock'), '');
  await assert.rejects(collectVideos({ conta: 'exemplo' }, { outputRoot }), /Já existe uma coleta/);
});

test('HTTP 429 não é repetido e erros transitórios têm tentativas limitadas', async () => {
  let calls = 0;
  const rateLimited = new InstagramPublicClient({ fetchImpl: async () => {
    calls++; return new Response('', { status: 429 });
  }, wait: async () => {} });
  await assert.rejects(rateLimited.profile('exemplo'), /429/);
  assert.equal(calls, 1);
  calls = 0;
  const transient = new InstagramPublicClient({ fetchImpl: async () => {
    calls++; throw new Error('network');
  }, wait: async () => {} });
  await assert.rejects(transient.profile('exemplo'), /network/);
  assert.equal(calls, 3);
});
