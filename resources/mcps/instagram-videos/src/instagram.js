import { setTimeout as sleep } from 'node:timers/promises';

export function normalizeAccount(value) {
  if (typeof value !== 'string') throw new Error('Informe o nome da conta.');
  const account = value.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_](?:[a-z0-9._]{0,28}[a-z0-9_])?$/.test(account)
      || account.includes('..') || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(account)) {
    throw new Error('Conta inválida: use somente o nome de usuário do Instagram (até 30 caracteres).');
  }
  return account;
}

function metric(...values) {
  return values.find(value => typeof value === 'number' && Number.isFinite(value) && value >= 0) ?? '';
}

export function videoRows(post, account, collectedAt) {
  const children = post.carousel_media ?? post.edge_sidecar_to_children?.edges?.map(edge => edge.node);
  const candidates = children ?? [post];
  const caption = post.caption?.text ?? post.edge_media_to_caption?.edges?.[0]?.node?.text ?? '';
  const timestamp = Number(post.taken_at ?? post.taken_at_timestamp);
  const published = Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000).toISOString() : '';
  const code = post.code ?? post.shortcode ?? '';
  return candidates.filter(item => item.is_video === true || item.media_type === 2 || item.__typename === 'GraphVideo')
    .map(item => {
      const id = item.pk ?? item.id;
      if (id == null) throw new Error('Vídeo sem ID estável.');
      return {
        id: String(id), conta: account, publicacao_id: String(post.pk ?? post.id ?? id),
        shortcode: code, url: code ? `https://www.instagram.com/p/${code}/` : '',
        publicado_em: published, legenda: caption,
        visualizacoes: metric(item.video_view_count, item.view_count),
        reproducoes: metric(item.video_play_count, item.play_count),
        curtidas: metric(item.like_count, item.edge_media_preview_like?.count, item.edge_liked_by?.count),
        comentarios: metric(item.comment_count, item.edge_media_to_comment?.count, item.edge_media_to_parent_comment?.count),
        duracao_segundos: metric(item.video_duration),
        video_url: item.video_versions?.[0]?.url ?? item.video_url ?? '',
        thumbnail_url: item.image_versions2?.candidates?.[0]?.url ?? item.display_url ?? item.thumbnail_src ?? '',
        coletado_em: collectedAt,
      };
    });
}

export class InstagramPublicClient {
  constructor({ fetchImpl = fetch, wait = sleep, retries = 2, timeoutMs = 20000, delayMs = 1500 } = {}) {
    this.fetch = fetchImpl;
    this.wait = wait;
    this.retries = retries;
    this.timeoutMs = timeoutMs;
    this.delayMs = delayMs;
    this.requested = false;
  }

  async json(url) {
    for (let attempt = 0; ; attempt++) {
      if (this.requested) await this.wait(this.delayMs * (attempt + 1));
      this.requested = true;
      try {
        const response = await this.fetch(url, {
          headers: {
            accept: 'application/json',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
            'x-ig-app-id': '936619743392459',
          },
          credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) {
          const error = new Error(`Instagram respondeu HTTP ${response.status}.`);
          error.retryable = response.status >= 500;
          throw error;
        }
        const body = await response.json();
        if (body.status === 'fail' || body.require_login || body.message === 'login_required') {
          const error = new Error('Instagram negou o acesso anônimo.');
          error.retryable = false;
          throw error;
        }
        return body;
      } catch (error) {
        if (error.retryable === false || attempt >= this.retries) throw error;
      }
    }
  }

  async profile(account) {
    const url = new URL('https://www.instagram.com/api/v1/users/web_profile_info/');
    url.searchParams.set('username', account);
    const body = await this.json(url);
    const user = body.data?.user;
    if (!user?.id) throw new Error('Perfil não encontrado ou resposta de perfil incompatível.');
    return user;
  }

  async feed(id, cursor) {
    const url = new URL(`https://www.instagram.com/api/v1/feed/user/${encodeURIComponent(id)}/`);
    url.searchParams.set('count', '50');
    if (cursor) url.searchParams.set('max_id', cursor);
    const body = await this.json(url);
    if (!Array.isArray(body.items)) throw new Error('Resposta do feed incompatível.');
    return { posts: body.items, hasNext: body.more_available === true, cursor: body.next_max_id };
  }

  async graphql(id, cursor) {
    const url = new URL('https://www.instagram.com/graphql/query/');
    // Consulta web não oficial. O Instagram pode alterar ou desativar este hash.
    url.searchParams.set('query_hash', '69cba40317214236af40e7efa697781d');
    url.searchParams.set('variables', JSON.stringify({ id: String(id), first: 50, ...(cursor ? { after: cursor } : {}) }));
    const body = await this.json(url);
    const timeline = body.data?.user?.edge_owner_to_timeline_media;
    if (!Array.isArray(timeline?.edges)) throw new Error('Resposta GraphQL incompatível.');
    return {
      posts: timeline.edges.map(edge => edge.node),
      hasNext: timeline.page_info?.has_next_page === true,
      cursor: timeline.page_info?.end_cursor,
    };
  }
}
