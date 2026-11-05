# instagram-videos (MCP)

Servidor MCP em Node.js que acessa a **API pública (web) do Instagram, sem
autenticação**, e coleta **todos os vídeos** de uma conta com as informações
básicas + **número de visualizações** e **número de curtidas**.

A lista é salva em `resources/videos/<conta>/lista.csv`, ordenada por data de
publicação (**do mais novo para o mais antigo**). O MCP pode ser executado
várias vezes: a cada execução os vídeos mais recentes são inseridos no início e
as métricas dos já existentes são atualizadas.

## Como funciona

1. `GET /api/v1/users/web_profile_info/?username=<conta>` — resolve o id
   numérico do usuário (usa o cabeçalho público `x-ig-app-id`).
2. `GET /api/v1/feed/user/<id>/?count=33&max_id=<cursor>` — pagina o feed
   enquanto `more_available` for `true`, usando `next_max_id` como cursor.

Se ocorrer um erro de acesso (rate-limit, HTTP 4xx/5xx, login wall etc.), ele é
**ignorado**: a coleta para naquele ponto e tudo que já foi baixado é salvo.
Há um intervalo de ~1,2s entre páginas para reduzir o risco de bloqueio.

> Observação: a API pública do Instagram é instável e aplica rate-limit. Em
> contas grandes é comum a paginação parar antes do fim — rode novamente mais
> tarde para complementar a lista (o merge cuida de não duplicar).

## Ferramenta exposta

### `fetch_account_videos`

| Parâmetro  | Tipo   | Obrigatório | Descrição                                            |
|------------|--------|-------------|------------------------------------------------------|
| `username` | string | sim         | Nome de usuário (@) da conta pública.                |
| `maxPages` | number | não         | Limite de páginas a percorrer (padrão: todas).       |

Retorna um resumo (vídeos coletados, novos, atualizados, total no arquivo,
páginas percorridas, erros ignorados e o caminho do CSV).

## Formato do CSV

Colunas: `shortcode, url, type, taken_at, timestamp, views, likes, comments,
duration, caption, thumbnail`.

- `taken_at`: ISO 8601 (UTC). `timestamp`: epoch em segundos (usado na ordenação).
- `views`: visualizações (`play_count`). `likes`: curtidas (`like_count`).

## Instalação

```bash
cd resources/mcps/instagram-videos
npm install
```

## Registro no Claude Code

```bash
claude mcp add instagram-videos -- node /caminho/abs/resources/mcps/instagram-videos/index.js
```

Ou, em um `claude_desktop_config.json` / `.mcp.json`:

```json
{
  "mcpServers": {
    "instagram-videos": {
      "command": "node",
      "args": ["/caminho/abs/resources/mcps/instagram-videos/index.js"]
    }
  }
}
```

Por padrão o CSV é gravado em `resources/videos/<conta>/lista.csv` (caminho
relativo à raiz do projeto, resolvido a partir da pasta do MCP). É possível
sobrescrever a pasta de saída com a variável de ambiente `OUTPUT_DIR`.

## Teste rápido (sem registrar)

```bash
printf '%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"fetch_account_videos","arguments":{"username":"NOME_DA_CONTA"}}}' \
  | node index.js
```
