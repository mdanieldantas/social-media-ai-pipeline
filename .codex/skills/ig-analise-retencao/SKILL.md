---
name: ig-analise-retencao
description: Analisa a RETENÇÃO de Reels do Instagram a partir de transcrições — o que segura a pessoa do começo ao fim. Mapeia pattern interrupts, lacunas de curiosidade, cliffhangers, re-ganchos no meio, mudanças de ritmo, gatilhos de engajamento (comentário/save/share) e o loop/CTA de fechamento. Use quando o usuário falar em "retenção", "o que segura", "o que prende até o fim", "loops", "cliffhanger", "CTA", "gatilho de comentário", ou "por que as pessoas assistem até o final". Aceita texto colado direto OU uma pasta de transcrições.
---

# ig-analise-retencao — Análise de retenção

Analisa **o corpo inteiro** do Reels: tudo que acontece depois do gancho para impedir a pessoa de rolar embora, e o fechamento que gera replay/ação. Objetivo: entender as **técnicas de retenção recorrentes** do criador, não avaliar um vídeo isolado.

## Passo 0 — Carregar a lente (obrigatório)
Antes de analisar, leia `.claude/skills/ig-contexto/SKILL.md` e use a **gramática de viralização** como régua (seções de retenção, loops, gatilhos de comentário e CTA).

## Passo 1 — Reunir o material
- **Texto no prompt:** uma ou várias transcrições coladas → use direto.
- **Pasta de transcrições:** leia **todos** os arquivos de texto da pasta apontada (ignore mídia `.mp4`), e junte num corpus único mantendo separação por vídeo.

Se não estiver claro de onde vem o material, pergunte só isso.

## Passo 2 — Analisar a curva de retenção de cada vídeo
Percorra cada transcrição do começo ao fim procurando as alavancas abaixo e **cite o trecho real** de cada uma:
- **Pattern interrupts** — viradas de ritmo/assunto/tom que reacordam a atenção.
- **Lacunas de curiosidade** — perguntas/abertas plantadas que só se resolvem depois.
- **Open loops / cliffhangers** — promessas entregues em partes ("os 3 princípios…" → 1, 2, 3), segurando até o fim.
- **Re-ganchos no meio** — nova promessa/virada no miolo para reter quem ia desistir.
- **Mudança de ritmo** — frases curtas vs. longas, aceleração, pausa, enumeração.
- **Específico como cola** — números/detalhes concretos que prendem ("97 cm de braço", "1 milhão em 35 dias").
- **Gatilhos de engajamento** — o que provoca comentário ("Será que não é isso que tá faltando no seu conteúdo?"), save (utilidade/lista) ou share (identificação).
- **Loop de fechamento** — o final puxa o começo? Faz reassistir?
- **CTA** — o que pede no fim (seguir, comentar, salvar, virar criador, próximo episódio).

## Passo 3 — Mapear os padrões recorrentes
Olhando o conjunto:
- Quais alavancas de retenção o criador **mais repete**?
- Ele usa **estrutura de lista/numeração** para segmentar e prometer (1, 2, 3)?
- Como ele costuma **fechar** — loop, CTA, bordão, virada? É sempre igual?
- Onde estão os **pontos de fuga** prováveis (trechos sem alavanca, miolo mole)?
- Qual a **mecânica de retenção assinatura** dele?

## Formato de saída
1. **Resumo da mecânica de retenção** (2–4 linhas): como esse criador segura a audiência.
2. **Linha do tempo por vídeo:** começo → meio → fim, marcando cada alavanca com o trecho real.
3. **Padrões recorrentes:** as técnicas mais usadas + o padrão de fechamento/CTA, com exemplos.
4. **Gatilhos de engajamento:** o que ele faz para comentário/save/share, citando trechos.
5. **Furos de retenção:** onde o público provavelmente desiste e por quê.
6. **Receita replicável:** 2–4 técnicas de retenção do próprio criador, prontas para reusar.

Sempre **baseado em trechos reais**. Nada de "mantenha a atenção do público" genérico.
