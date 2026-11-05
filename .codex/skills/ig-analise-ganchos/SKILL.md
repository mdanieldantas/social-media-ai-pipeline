---
name: ig-analise-ganchos
description: Analisa os GANCHOS (os primeiros segundos / aberturas) de Reels do Instagram a partir de transcrições. Classifica o tipo de gancho, explica por que cada um trava o scroll e mapeia os padrões de abertura que o criador repete. Use quando o usuário falar em "ganchos", "aberturas", "as primeiras frases", "como ele começa os vídeos", "hooks", ou pedir para analisar o início/primeiros segundos de Reels de um criador. Aceita texto colado direto OU uma pasta de transcrições.
---

# ig-analise-ganchos — Análise dos ganchos / aberturas

Analisa **apenas o começo** de cada Reels: a abertura que decide se a pessoa para de rolar ou some. O objetivo é entender o **estilo de gancho** do criador no geral — os padrões que ele repete — não criticar um vídeo isolado.

## Passo 0 — Carregar a lente (obrigatório)
Antes de analisar, leia `.claude/skills/ig-contexto/SKILL.md` e use a **gramática de viralização** como régua. Julgue os ganchos pelo critério "isso trava o scroll nos primeiros segundos?", não por gramática formal.

## Passo 1 — Reunir o material
O input pode vir de duas formas:
- **Texto no prompt:** uma transcrição ou várias coladas juntas → use direto.
- **Pasta de transcrições:** o usuário aponta um diretório (ex.: `resources/videos/<criador>/`). Leia **todos** os arquivos de texto (`.txt`/`.md`/`.csv` de legenda) da pasta, ignore arquivos de mídia (`.mp4` etc.), e junte tudo num único corpus, mantendo a separação por vídeo (cada arquivo = um vídeo). 

Se o usuário não disser de onde vem o material, pergunte só isso (texto ou caminho da pasta).

## Passo 2 — Isolar o gancho de cada vídeo
Para cada transcrição, isole **apenas a abertura** (aproximadamente a primeira frase ou as primeiras ~2 frases / primeiros segundos). É só nisso que esta skill foca.

## Passo 3 — Classificar cada gancho
Classifique cada abertura por **tipo**. Tipos comuns (use estes e crie outros se aparecerem):
- **Afirmação polêmica / contra-intuitiva** — quebra uma crença ("Nosso relacionamento não é baseado no amor e nem no sexo").
- **Número/dado específico** — promessa concreta ("ganhou 1 milhão de seguidores em 35 dias", "são uns 15 quilos").
- **Pergunta direta** — joga a dúvida no espectador.
- **Promessa / lista anunciada** — "os 3 princípios que ele usa pra…".
- **Cena sem contexto (curiosity gap)** — começa no meio de algo que ainda não faz sentido.
- **Identificação / "isso é você"** — espelha uma dor ou situação do público.
- **Bordão / marcador de série** — "Esse é o episódio 2 da série…".
- **Confissão / vulnerabilidade** — admite algo pessoal ou embaraçoso.

Para cada gancho: cite o **trecho real**, dê o **tipo**, e explique em 1–2 linhas **por que aquilo trava o scroll** (qual sinal da gramática de viralização ele aciona).

## Passo 4 — Mapear os padrões recorrentes
Olhando o conjunto, responda:
- Quais **tipos de gancho** o criador mais usa? (frequência aproximada)
- Existem **fórmulas de abertura** que ele repete (mesma estrutura sintática, mesmo bordão, mesmo tipo de número)?
- Ele abre **no pico** (sem introdução) ou às vezes "esquenta"? 
- Qual o **padrão vencedor dominante** — a assinatura de abertura dele?

## Formato de saída
1. **Resumo do estilo de gancho** (2–4 linhas): a assinatura de abertura do criador.
2. **Tabela / lista por vídeo:** trecho do gancho → tipo → por que funciona.
3. **Padrões recorrentes:** os tipos mais usados e as fórmulas repetidas, com exemplos reais.
4. **O que ele evita / pontos fracos** (se houver ganchos mornos, diga qual e por quê).
5. **Receita replicável:** 2–4 "moldes" de gancho extraídos do próprio criador, prontos para reusar.

Seja **específico e baseado em evidências do texto** — sempre cite trechos reais. Nada de conselho genérico de "faça um bom gancho".
