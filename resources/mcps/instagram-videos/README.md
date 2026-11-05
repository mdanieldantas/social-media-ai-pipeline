# MCP Instagram Videos

Servidor MCP local via stdio em JavaScript/Node.js 20+. Expõe `atualizar_videos_instagram` e também pode ser executado pela linha de comando, sem conta de desenvolvedor, senha, cookie ou token.

## Limitação do acesso anônimo

A [API oficial do Instagram exige autenticação](https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api). Este projeto usa os **endpoints web não oficiais** `web_profile_info`, `feed/user` e uma consulta GraphQL pública do site, sem enviar credenciais. Esses endpoints e o hash GraphQL podem mudar ou ser bloqueados a qualquer momento. Não há garantia de obter todos os vídeos ou suas métricas. Conta privada, login obrigatório, HTTP 403/429 e respostas incompatíveis resultam em coleta parcial, explicitada no retorno. Não há contorno de login, desafios ou bloqueios.

## Instalar e executar

No PowerShell, a partir da raiz deste projeto:

```powershell
cd resources/mcps/instagram-videos
npm.cmd ci
npm.cmd run collect -- nome_da_conta
```

O segundo argumento opcional limita as páginas obtidas (incluindo a página do perfil). O padrão `0` percorre todas as páginas acessíveis:

```powershell
npm.cmd run collect -- nome_da_conta 10
npm.cmd test
```

O CSV fica sempre em `resources/videos/<conta>/lista.csv`, relativo ao projeto, independentemente do diretório em que o processo foi iniciado. A conta é normalizada em minúsculas e aceita `@` inicial. Não informe URL de perfil.

## Configurar no cliente MCP

Acrescente este servidor à configuração de servidores MCP do seu cliente; ajuste o caminho absoluto caso mova o projeto:

```json
{
  "mcpServers": {
    "instagram-videos": {
      "command": "node",
      "args": [
        "C:/repos/ai-driven-development/projetos/projeto-instagran/resources/mcps/instagram-videos/src/server.js"
      ]
    }
  }
}
```

Chamada da ferramenta:

```json
{
  "name": "atualizar_videos_instagram",
  "arguments": { "conta": "nome_da_conta", "maxPaginas": 0 }
}
```

O retorno informa `arquivo`, `paginasObtidas`, `videosObtidos`, `novosVideos`, `totalSalvo`, `paginacaoConcluida`, `motivo` e `avisos`. `paginacaoConcluida` significa que a fonte consultada anunciou o fim; não certifica que o Instagram expôs todo o histórico. Falha de acesso é um resultado parcial; entrada inválida, CSV corrompido e erro de disco são erros da ferramenta. O stdout do servidor é exclusivo do protocolo MCP.

## Dados e atualização

- Uma linha por vídeo, incluindo cada vídeo de carrosséis. Imagens são ignoradas.
- Colunas: `id`, `conta`, `publicacao_id`, `shortcode`, `url`, `publicado_em`, `legenda`, `visualizacoes`, `reproducoes`, `curtidas`, `comentarios`, `duracao_segundos`, `video_url`, `thumbnail_url`, `coletado_em`.
- Datas em UTC/ISO 8601; ordenação da publicação mais recente para a mais antiga. Publicações sem data ficam no fim.
- Métricas indisponíveis ficam vazias. Zero é preservado. Visualizações e reproduções são métricas distintas; uma não substitui a outra. Em carrosséis, curtidas/comentários do pai não são atribuídos aos vídeos filhos.
- Reexecuções mesclam por ID, acrescentam os novos vídeos, atualizam campos disponíveis dos já conhecidos e preservam registros antigos e métricas que não voltaram na resposta. O CSV é regravado ordenado, sem duplicatas; não são removidos vídeos que sumiram do perfil.
- Não interrompe ao encontrar um vídeo conhecido: posts fixados e lacunas anteriores poderiam fazer perder vídeos. Por isso reconsulta o histórico acessível.
- Salva cada página com substituição atômica do arquivo. Erro em um item não descarta os demais. Se uma fonte falhar, tenta a fonte alternativa com seu próprio cursor. Não é possível pular uma página sem conhecer o próximo cursor.
- Aplica intervalo de 1,5 s entre requisições, timeout de 20 s e até duas novas tentativas para falhas transitórias. HTTP 4xx não é repetido; não há loop em cursor repetido.
- Evita duas coletas simultâneas da mesma conta usando `.coleta.lock`. Após encerramento forçado, remova esse arquivo somente quando não houver uma coleta ativa.

Somente os metadados são salvos; os arquivos de vídeo não são baixados. URLs de mídia podem expirar. O CSV contém texto original das legendas; ao abri-lo em planilhas, importe as colunas de texto como texto.

## Verificação

`npm.cmd test` testa respostas simuladas (paginação, alternativa, bloqueios, checkpoints, carrosséis, métricas ausentes, reexecução, CSV e concorrência) e uma conexão real ao servidor MCP local via SDK. Os testes não fazem consultas reais ao Instagram e não comprovam disponibilidade dos endpoints anônimos.

Referência do transporte e ferramentas: [SDK MCP](https://ts.sdk.modelcontextprotocol.io/).
