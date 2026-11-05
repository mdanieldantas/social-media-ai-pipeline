---
name: ig-analise-storytelling
description: Analisa o STORYTELLING / a construção narrativa de Reels do Instagram a partir de transcrições. Mapeia o arco da história, uso de personagens e exemplos concretos, loops abertos e payoffs, estrutura de argumento (listas, jornada), batidas emocionais e o uso do específico vs. abstrato. Use quando o usuário falar em "storytelling", "narrativa", "como ele conta história", "arco", "personagens", "exemplos", "estrutura do roteiro", "jornada" ou "construção do argumento". Aceita texto colado direto OU uma pasta de transcrições.
---

# ig-analise-storytelling — Análise da construção narrativa

Analisa **como o criador constrói a história/argumento** dentro do Reels: a arquitetura que transforma uma fala em narrativa que prende e convence. Objetivo: entender os **padrões narrativos recorrentes** do criador, não resenhar um vídeo isolado.

## Passo 0 — Carregar a lente (obrigatório)
Antes de analisar, leia `.claude/skills/ig-contexto/SKILL.md` e use a **gramática de viralização** como régua — sobretudo "específico > abstrato", open loops/payoffs e a lógica de série/formato.

## Passo 1 — Reunir o material
- **Texto no prompt:** uma ou várias transcrições coladas → use direto.
- **Pasta de transcrições:** leia **todos** os arquivos de texto da pasta apontada (ignore mídia), e junte num corpus único mantendo separação por vídeo.

Se não estiver claro de onde vem o material, pergunte só isso.

## Passo 2 — Dissecar a narrativa de cada vídeo
Para cada transcrição, identifique e **cite o trecho real**:
- **Arco da história** — qual a forma? (problema → virada → resolução; antes → depois; jornada do herói; lista argumentada; tese → provas → conclusão).
- **Personagens** — quem aparece (o criador, "o Alex", "Rodrigo Pantera", a esposa, um "você" implícito)? Como são usados para criar identificação ou autoridade?
- **Exemplos concretos** — cenas específicas que ancoram a ideia ("tira o colchão da cama, bota no chão e dorme", "ostenta arroz e bolacha recheada").
- **Loops abertos e payoffs** — o que é prometido cedo e pago depois; a promessa é cumprida?
- **Estrutura de argumento** — é lista numerada (1, 2, 3)? jornada cronológica? acumulação de provas?
- **Batidas emocionais** — onde sobe/desce a emoção (vulnerabilidade, virada, esperança, provocação, alívio).
- **Específico vs. abstrato** — proporção de detalhe concreto vs. conselho vago; o concreto é a força narrativa.

## Passo 3 — Mapear os padrões recorrentes
Olhando o conjunto:
- Quais **formas de arco** o criador mais repete?
- Ele tem um **molde de roteiro** assinatura (ex.: tese polêmica → história pessoal → lista de princípios → CTA de virada)?
- Como usa **personagens recorrentes** e o "você" (o espectador) na história?
- Como equilibra **história pessoal** vs. **argumento/ensino**?
- Onde está a **força** (specifics, batidas emocionais) e onde escorrega para o abstrato?

## Formato de saída
1. **Resumo do estilo narrativo** (2–4 linhas): como esse criador conta história.
2. **Mapa narrativo por vídeo:** arco + batidas + payoff, com trechos reais.
3. **Padrões recorrentes:** os moldes de roteiro e o uso de personagens/exemplos, com exemplos.
4. **Específico vs. abstrato:** onde ele acerta no concreto e onde dilui no genérico, citando.
5. **Receita replicável:** o(s) molde(s) de roteiro do próprio criador, prontos para reusar.

Sempre **baseado em trechos reais** das transcrições. Nada de teoria de storytelling solta.
