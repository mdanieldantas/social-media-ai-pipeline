// Cliente para a API pública (web) do Instagram, sem autenticação.
//
// Estratégia (sem login/cookies de sessão/tokens de usuário):
//  1. GET /api/v1/users/web_profile_info/?username=<conta>
//     -> resolve o id numérico, total de mídias e se a conta é privada.
//  2. Paginação PRIMÁRIA pelo mesmo caminho que o site usa ao rolar o perfil:
//     POST /graphql/query com a query "PolarisProfilePostsTabContentQuery".
//     Para isso, lê do HTML público do perfil os tokens efêmeros `csrftoken`
//     (cookie) e `lsd`. Pagina pelo cursor `end_cursor` da connection
//     `xdt_api__v1__feed__user_timeline_graphql_connection`.
//  3. AUTO-CURA: o Instagram rotaciona o `doc_id` da query. Se o doc_id fixo
//     falhar, os bundles JS do perfil são raspados para descobrir o doc_id
//     atual e a chamada é refeita.
//  4. FALLBACK: se o caminho GraphQL falhar logo na 1ª página, tenta o
//     endpoint legado /api/v1/feed/user/<id>/ (hoje costuma exigir login).
//
// Erros de página são ignorados: a função retorna tudo que conseguiu coletar.

const WEB_APP_ID = "936619743392459";
const PAGE_SIZE = 12;

// doc_id padrão da query de posts do perfil (web). É sobrescrito em runtime
// pelo valor raspado dos bundles caso este falhe (o Instagram rotaciona).
// Pode ser fixado via env IG_POSTS_DOC_ID.
const DEFAULT_POSTS_DOC_ID =
  process.env.IG_POSTS_DOC_ID || "27964987773089789";

const POSTS_FRIENDLY_NAME =
  "PolarisProfilePostsTabContentQuery_connection_" +
  "xdt_api__v1__feed__user_timeline_graphql_connection";

// Flags de "provided variables" exigidas pela query (lidas do bundle). Mantê-las
// presentes (mesmo como false) evita o "execution error" da API.
const PROVIDER_FLAGS = [
  "__relay_internal__pv__PolarisCannesGuardianExperienceEnabledrelayprovider",
  "__relay_internal__pv__PolarisCASB976ProfileEnabledrelayprovider",
  "__relay_internal__pv__PolarisWebSchoolsEnabledrelayprovider",
  "__relay_internal__pv__PolarisRepostsConsumptionEnabledrelayprovider",
  "__relay_internal__pv__PolarisImmersiveFeedChainingEnabledrelayprovider",
  "__relay_internal__pv__PolarisAIGMAccountLabelEnabledrelayprovider",
];

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "x-ig-app-id": WEB_APP_ID,
  "X-Requested-With": "XMLHttpRequest",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, { referer, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          ...DEFAULT_HEADERS,
          ...(referer ? { Referer: referer } : {}),
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Resposta não é JSON (possível bloqueio/login wall).");
      }
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(800 * (attempt + 1));
    }
  }
  throw lastErr;
}

// media_type: 1 = imagem, 2 = vídeo, 8 = carrossel.
function isVideoItem(item) {
  return (
    item?.media_type === 2 ||
    item?.product_type === "clips" ||
    item?.product_type === "igtv"
  );
}

// Normaliza um "item" do feed v1 (ou nó da connection web, mesmo formato) para
// um registro de vídeo.
function itemToVideo(item, username) {
  const shortcode = item.code || "";
  const timestamp = item.taken_at || 0;
  const caption = item.caption?.text ?? "";

  const views =
    item.play_count ?? item.ig_play_count ?? item.view_count ?? null;
  const likes = item.like_count ?? null;
  const comments = item.comment_count ?? null;

  const isReel = item.product_type === "clips" || item.product_type === "igtv";
  const path = isReel ? "reel" : "p";

  const thumbnail =
    item.image_versions2?.candidates?.[0]?.url || item.display_uri || "";

  return {
    shortcode,
    url: shortcode ? `https://www.instagram.com/${path}/${shortcode}/` : "",
    username,
    type: item.product_type || "video",
    timestamp,
    taken_at: timestamp ? new Date(timestamp * 1000).toISOString() : "",
    views,
    likes,
    comments,
    duration: item.video_duration ?? null,
    caption,
    thumbnail,
  };
}

// Resolve o id numérico do usuário a partir do username.
async function fetchProfile(username) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(
    username
  )}`;
  const json = await fetchJson(url, {
    referer: `https://www.instagram.com/${username}/`,
  });
  const user = json?.data?.user;
  if (!user || !user.id) {
    throw new Error("Perfil não encontrado ou bloqueado pela API pública.");
  }
  return {
    id: user.id,
    totalMedia: user.edge_owner_to_timeline_media?.count ?? null,
    isPrivate: user.is_private === true,
  };
}

// Lê o HTML público do perfil e extrai os tokens efêmeros (csrftoken + lsd)
// que a query GraphQL web exige. Guarda o HTML para uma eventual raspagem do
// doc_id atual a partir dos bundles JS.
async function bootstrapWebSession(username) {
  const res = await fetch(`https://www.instagram.com/${username}/`, {
    headers: { ...DEFAULT_HEADERS, Accept: "text/html,application/xhtml+xml" },
  });
  const html = await res.text();
  const setCookie = res.headers.get("set-cookie") || "";
  const csrf =
    setCookie.match(/csrftoken=([^;]+)/)?.[1] ||
    html.match(/"csrf_token":"([^"]+)"/)?.[1] ||
    null;
  const lsd =
    html.match(/"LSD",\[\],\{"token":"([^"]+)"/)?.[1] ||
    html.match(/"lsd":"([^"]+)"/)?.[1] ||
    null;
  return { csrf, lsd, html };
}

// Raspa os bundles JS referenciados no HTML do perfil em busca do doc_id atual
// da query de posts (auto-cura quando o Instagram rotaciona o id).
async function scrapePostsDocId(html) {
  const bundles = [
    ...new Set([...html.matchAll(/(https:\/\/[^"]+?\.js)"/g)].map((m) => m[1])),
  ];
  // Prioriza bundles cujo nome sugira o módulo de posts do perfil.
  bundles.sort(
    (a, b) => (/Profile|Posts|Consumer/i.test(b) ? 1 : 0) -
      (/Profile|Posts|Consumer/i.test(a) ? 1 : 0)
  );
  for (const url of bundles.slice(0, 12)) {
    try {
      const txt = await (
        await fetch(url, { headers: { "User-Agent": DEFAULT_HEADERS["User-Agent"] } })
      ).text();
      if (!txt.includes("ProfilePostsTabContentQuery")) continue;
      const m = txt.match(
        /PolarisProfilePostsTabContentQuery_connection[\s\S]{0,4000}?"(\d{15,})"/
      );
      if (m) return m[1];
    } catch {
      // ignora bundle inacessível e tenta o próximo
    }
  }
  return null;
}

// Monta o corpo do POST GraphQL para uma página de posts do perfil.
function buildPostsBody({ username, after, docId, lsd }) {
  const variables = {
    after: after || null,
    before: null,
    data: { count: PAGE_SIZE },
    first: PAGE_SIZE,
    last: null,
    username,
  };
  for (const f of PROVIDER_FLAGS) variables[f] = false;

  const body = new URLSearchParams();
  body.set("av", "0");
  body.set("__comet_req", "7");
  body.set("lsd", lsd || "");
  body.set("doc_id", docId);
  body.set("fb_api_caller_class", "RelayModern");
  body.set("fb_api_req_friendly_name", POSTS_FRIENDLY_NAME);
  body.set("variables", JSON.stringify(variables));
  body.set("server_timestamps", "true");
  return body.toString();
}

// Busca uma página de posts via GraphQL web. Retorna a connection bruta.
async function fetchPostsPage({ username, after, docId, session }) {
  const res = await fetch("https://www.instagram.com/graphql/query", {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      "x-csrftoken": session.csrf || "",
      "x-fb-lsd": session.lsd || "",
      "x-fb-friendly-name": POSTS_FRIENDLY_NAME,
      Referer: `https://www.instagram.com/${username}/`,
      Cookie: session.csrf ? `csrftoken=${session.csrf}` : "",
    },
    body: buildPostsBody({ username, after, docId, lsd: session.lsd }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = JSON.parse(await res.text());
  const conn = json?.data?.xdt_api__v1__feed__user_timeline_graphql_connection;
  if (!conn) {
    const msg = JSON.stringify(json?.errors || json?.error || "sem connection");
    throw new Error(`GraphQL sem dados: ${msg.slice(0, 120)}`);
  }
  return conn;
}

// Coleta via GraphQL web (caminho primário). Lança erro se nem a 1ª página vier.
async function collectViaGraphql({ username, maxPages, onLog }) {
  const session = await bootstrapWebSession(username);
  if (!session.csrf || !session.lsd) {
    throw new Error("Não foi possível obter tokens (csrf/lsd) do HTML.");
  }

  let docId = DEFAULT_POSTS_DOC_ID;
  let after = null;
  let more = true;
  let pagesFetched = 0;
  const videos = [];
  const seen = new Set();

  while (more && pagesFetched < maxPages) {
    if (pagesFetched > 0) await sleep(1200); // educado com o rate-limit
    let conn;
    try {
      conn = await fetchPostsPage({ username, after, docId, session });
    } catch (err) {
      // Auto-cura na 1ª página: doc_id pode ter rotacionado.
      if (pagesFetched === 0) {
        const fresh = await scrapePostsDocId(session.html);
        if (fresh && fresh !== docId) {
          onLog(`doc_id ${docId} falhou; usando doc_id raspado ${fresh}.`);
          docId = fresh;
          conn = await fetchPostsPage({ username, after, docId, session });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    pagesFetched++;
    let pageVideos = 0;
    for (const edge of conn.edges || []) {
      const node = edge.node;
      if (!isVideoItem(node)) continue;
      const v = itemToVideo(node, username);
      if (v.shortcode && !seen.has(v.shortcode)) {
        seen.add(v.shortcode);
        videos.push(v);
        pageVideos++;
      }
    }
    onLog(
      `[graphql] Página ${pagesFetched}: ${(conn.edges || []).length} mídias, ` +
        `+${pageVideos} vídeos (total vídeos: ${videos.length}).`
    );
    more = conn.page_info?.has_next_page === true && !!conn.page_info?.end_cursor;
    after = conn.page_info?.end_cursor || null;
  }

  return { videos, pagesFetched };
}

// Busca uma página do feed v1 (caminho de fallback legado).
async function fetchFeedPage(userId, maxId, username) {
  let url = `https://www.instagram.com/api/v1/feed/user/${userId}/?count=33`;
  if (maxId) url += `&max_id=${encodeURIComponent(maxId)}`;
  const json = await fetchJson(url, {
    referer: `https://www.instagram.com/${username}/`,
  });
  return {
    items: json?.items || [],
    moreAvailable: json?.more_available === true,
    nextMaxId: json?.next_max_id || null,
  };
}

// Coleta via feed v1 (fallback). Reaproveita o que conseguir.
async function collectViaFeedV1({ userId, username, maxPages, onLog, seen, videos }) {
  let maxId = null;
  let more = true;
  let pagesFetched = 0;
  while (more && pagesFetched < maxPages) {
    if (pagesFetched > 0) await sleep(1200);
    const page = await fetchFeedPage(userId, maxId, username);
    pagesFetched++;
    let pageVideos = 0;
    for (const item of page.items) {
      if (!isVideoItem(item)) continue;
      const v = itemToVideo(item, username);
      if (v.shortcode && !seen.has(v.shortcode)) {
        seen.add(v.shortcode);
        videos.push(v);
        pageVideos++;
      }
    }
    onLog(
      `[feed-v1] Página ${pagesFetched}: ${page.items.length} mídias, ` +
        `+${pageVideos} vídeos (total vídeos: ${videos.length}).`
    );
    more = page.moreAvailable && !!page.nextMaxId;
    maxId = page.nextMaxId;
  }
  return pagesFetched;
}

/**
 * Coleta os vídeos de uma conta pública do Instagram.
 *
 * @param {string} username
 * @param {object} [opts]
 * @param {number} [opts.maxPages=Infinity] limite de páginas a percorrer
 * @param {(msg:string)=>void} [opts.onLog] callback de log
 * @returns {Promise<{username:string, userId:string, totalMedia:number|null,
 *   isPrivate:boolean, videos:object[], pagesFetched:number, errors:string[]}>}
 */
export async function fetchAccountVideos(username, opts = {}) {
  const { maxPages = Infinity, onLog = () => {} } = opts;
  const errors = [];
  let videos = [];
  const seen = new Set();

  const profile = await fetchProfile(username);
  onLog(
    `Perfil @${username} (id=${profile.id}) — total de mídias: ${
      profile.totalMedia ?? "?"
    }${profile.isPrivate ? " [PRIVADO]" : ""}.`
  );
  if (profile.isPrivate) {
    errors.push("Conta privada: a API pública não expõe as mídias.");
  }

  let pagesFetched = 0;

  // Caminho primário: GraphQL web (o mesmo que o site usa ao rolar o perfil).
  try {
    const r = await collectViaGraphql({ username, maxPages, onLog });
    for (const v of r.videos) {
      if (v.shortcode && !seen.has(v.shortcode)) {
        seen.add(v.shortcode);
        videos.push(v);
      }
    }
    pagesFetched += r.pagesFetched;
  } catch (err) {
    errors.push(`GraphQL web: ${err.message}`);
    onLog(`Caminho GraphQL falhou (${err.message}). Tentando fallback v1...`);
  }

  // Fallback legado: só vale a pena se o GraphQL não trouxe nada.
  if (videos.length === 0) {
    try {
      const fb = await collectViaFeedV1({
        userId: profile.id,
        username,
        maxPages,
        onLog,
        seen,
        videos,
      });
      pagesFetched += fb;
    } catch (err) {
      errors.push(`Feed v1: ${err.message}`);
      onLog(`Fallback v1 também falhou (${err.message}).`);
    }
  }

  // Ordena do mais novo para o mais antigo.
  videos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return {
    username,
    userId: profile.id,
    totalMedia: profile.totalMedia,
    isPrivate: profile.isPrivate,
    videos,
    pagesFetched,
    errors,
  };
}
