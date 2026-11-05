---
name: ig-analise-vocabulario
description: Analisa o VOCABULÁRIO / o jeito de falar de um criador de Reels do Instagram a partir de transcrições. Mapeia gírias, bordões, formas de tratamento, complexidade das frases, palavrões, referências culturais e expressões recorrentes. Use quando o usuário falar em "vocabulário", "como ele fala", "jeito de falar", "bordões", "gírias", "tom de voz", "palavrão", "expressões", "linguagem" ou pedir o glossário/voz do criador. Aceita texto colado direto OU uma pasta de transcrições.
---

# ig-analise-vocabulario — Análise do jeito de falar

Analisa **a voz do criador**: o léxico e os tiques de fala que tornam a comunicação dele reconhecível. Objetivo: extrair o **padrão de linguagem recorrente** — um retrato replicável da voz — não comentar um vídeo isolado.

## Passo 0 — Carregar a lente (obrigatório)
Antes de analisar, leia `.claude/skills/ig-contexto/SKILL.md` e use a **gramática de viralização** como régua — sobretudo "tom casual/lo-fi" e "cultura de internet BR". Oralidade, frase quebrada e gíria são **recursos**, não erros; não julgue pela régua de texto formal.

## Passo 1 — Reunir o material
- **Texto no prompt:** uma ou várias transcrições coladas → use direto.
- **Pasta de transcrições:** leia **todos** os arquivos de texto da pasta apontada (ignore mídia), e junte num corpus único mantendo separação por vídeo. Quanto mais transcrições, melhor o retrato da voz.

Se não estiver claro de onde vem o material, pergunte só isso.

## Passo 2 — Catalogar a fala
Percorra o corpus e levante, **com trechos/ocorrências reais**:
- **Gírias e coloquialismos** — ("mano", "véi", "matando todas", "tá ligado").
- **Bordões e expressões recorrentes** — frases-assinatura repetidas entre vídeos ("te vejo no próximo episódio", aberturas/fechamentos fixos).
- **Formas de tratamento** — como chama o público ("você", "tu", "galera", "mano", "criador") e como se posiciona (próximo, professor, parceiro).
- **Complexidade das frases** — curtas e secas? longas e corridas? sem pontuação? Qual o ritmo médio?
- **Palavrões e ênfase** — usa? quais? com que função (ênfase, humor, choque)? ("testar essa merda").
- **Referências culturais** — memes, outros criadores, marcas, regionalismos, internet BR ("ostenta arroz e bolacha recheada", citar Whindersson/Mari Krieger).
- **Tiques verbais** — muletas, conectivos repetidos, padrões de início de frase.

## Passo 3 — Mapear os padrões recorrentes
Olhando o conjunto:
- Quais palavras/expressões formam a **assinatura lexical** dele?
- Há **bordões fixos** de abertura e fechamento?
- O **registro** é mais íntimo, professoral, debochado, motivacional? Consistente entre vídeos?
- Qual o **nível de palavrão** e a função dele na voz?
- Que **repertório cultural** ele assume que o público compartilha?

## Formato de saída
1. **Resumo da voz** (2–4 linhas): como esse criador fala, em uma descrição reconhecível.
2. **Glossário do criador:** gírias, bordões e expressões recorrentes → com ocorrências reais e (quando útil) frequência.
3. **Formas de tratamento e registro:** como ele chama e se posiciona perante o público.
4. **Frases:** complexidade/ritmo típico + uso de palavrão, com exemplos.
5. **Repertório cultural:** referências e regionalismos citados.
6. **Guia de voz replicável:** um "cole isto" que permite escrever um roteiro novo soando como o criador (bordões, tom, do's & don'ts), tudo derivado dos trechos.

Sempre **baseado em ocorrências reais** do texto. Nada de descrição genérica de "tom informal".
