# Geração do Perfil de Comunicação do Micha Menezes

## Tarefas

### Fase 1: obteção dos dados

- [x] Obter a lista de vídeos do instagram da conta @michamenezes usando o MCP `resources/mcps/instagram-videos`
- [x] Obter os 10 melhores vídeos do instagram da conta @michamenezes usando o MCP `resources/mcps/instagram-top-videos-download`
- [x] Transcrever os vídeo usando o MCP `resources/mcps/video-transcricao`

### Fase 2: análise das transcrições

- [x] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-ganchos` e criar um arquivo para armazenar o resultado da análise em `ig-analise-ganchos.md`
- [x] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-retencao` e criar um arquivo para armazenar o resultado da análise em `ig-analise-retencao.md`
- [x] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-storytelling` e criar um arquivo para armazenar o resultado da análise em `ig-analise-storytelling.md`
- [x] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-vocabulario` e criar um arquivo para armazenar o resultado da análise em `ig-analise-vocabulario.md`
- [x] Gere o arquivo final de perfil de comunicação usando a skill `.claude/skills/ig-perfil-comunicacao` com base nas análises anteriores no arquivo perfil-michamenezes.md

## Log de execução

### Fase 1 — Tarefa 1: Obter lista de vídeos (BLOQUEADA → RESOLVIDA)

- **2026-05-27 16:33 a 16:38 (-03):** Executado o MCP `instagram-videos` (`fetch_account_videos`, username `michamenezes`) **5 vezes**. Todas falharam com `HTTP 401 Unauthorized` (login wall / rate-limit da API pública). CSV permaneceu vazio.
- **2026-05-27 23:39 (-03):** Reexecutado `fetch_account_videos` (username `michamenezes`). **Sucesso.** `userId=7286488867`, `totalMediaNaConta=1992`. **1157 vídeos** coletados (1157 novos), 166 páginas percorridas, 0 erros. CSV: `resources/videos/michamenezes/lista.csv` (1158 linhas com header).

### Fase 1 — Tarefa 2: Baixar top 10 vídeos

- **2026-05-27 23:40 (-03):** Executado `download_top_videos` (`csvPath=resources/videos/michamenezes/lista.csv`, `count=10`). **10/10 baixados, 0 erros.** Shortcodes (ordem por likes): DPT6BWZDcrp (101.673), DLN_f9BvwYr (78.340), DUn9-OXEVIZ (76.503), DTiSVvwjbRW (71.609), DNNwK8uNjZs (65.160), DJUFY2BxAMv (60.347), DLSV5I8sZC6 (57.242), DNDZuk6OWOu (56.461), DLfL4kLuojK (43.877), DGftG9IOqUK (43.877). Arquivos `<ordem>_<shortcode>.mp4` em `resources/videos/michamenezes/`.

### Fase 1 — Tarefa 3: Transcrever os vídeos

- **2026-05-27 23:41 (-03):** Executado `transcrever_pasta` (`folderPath=resources/videos/michamenezes`). **10/10 transcritos, 0 pulados, 0 erros.** Saída: 10 arquivos `.txt` (255–1614 caracteres) ao lado de cada `.mp4`.

### Fase 2 — Tarefa 1: Análise de ganchos

- **2026-05-27 23:42 (-03):** Skill `ig-analise-ganchos` executada sobre as 10 transcrições, com a lente `ig-contexto/SKILL.md` carregada. Resultado salvo em `resources/videos/michamenezes/ig-analise-ganchos.md`. Identificada a assinatura: identidade polêmica + objeção antecipada (#6/#10), pergunta-dor → promessa (#1/#5), negação encadeada (#9), confissão + open loop (#4).

### Fase 2 — Tarefa 2: Análise de retenção

- **2026-05-27 23:43 (-03):** Skill `ig-analise-retencao` executada. Resultado salvo em `resources/videos/michamenezes/ig-analise-retencao.md`. Alavanca assinatura: objeção encenada ("Ah, mas...? Problemas."), causa→efeito→venda, loop literal de fechamento.

### Fase 2 — Tarefa 3: Análise de storytelling

- **2026-05-27 23:45 (-03):** Skill `ig-analise-storytelling` executada. Resultado salvo em `resources/videos/michamenezes/ig-analise-storytelling.md`. Molde-assinatura: tese → contraste binário → exemplos concretos → moral aplicada ao "você" → CTA.

### Fase 2 — Tarefa 4: Análise de vocabulário

- **2026-05-27 23:46 (-03):** Skill `ig-analise-vocabulario` executada. Resultado salvo em `resources/videos/michamenezes/ig-analise-vocabulario.md`. Voz: professor-pregador casual, sem palavrão, "você" no singular, "meu filho" como bronca, bordões fixos de abertura/fechamento.

### Fase 2 — Tarefa 5: Perfil de comunicação (síntese final)

- **2026-05-27 23:48 (-03):** Skill `ig-perfil-comunicacao` executada com as 4 análises como insumo. Perfil prescritivo e autossuficiente salvo em `resources/videos/michamenezes/perfil-michamenezes.md` (seções 1–8 + checklist de conformidade).

### Resumo da execução

Todas as 8 tarefas da spec foram concluídas em sequência entre **2026-05-27 23:39 e 23:48 (-03)**. Artefatos finais em `resources/videos/michamenezes/`:
- `lista.csv` (1157 vídeos catalogados)
- `1_*.mp4` … `10_*.mp4` (top 10 por likes)
- `1_*.txt` … `10_*.txt` (transcrições)
- `ig-analise-ganchos.md`, `ig-analise-retencao.md`, `ig-analise-storytelling.md`, `ig-analise-vocabulario.md` (análises dimensionais)
- `perfil-michamenezes.md` (perfil de comunicação final, pronto pra ser entregue junto de uma copy)
