---
name: ig-perfil-comunicacao
description: Consolida as análises de Reels de um criador (ganchos, vocabulário/tom, storytelling, retenção) num único PERFIL DE COMUNICAÇÃO salvo como arquivo Markdown — um guia prescritivo e autossuficiente da voz do influenciador, feito para ser entregue depois junto de uma copy para a IA reescrever o texto naquela voz. Use quando o usuário pedir para "criar/gerar o perfil de comunicação", "consolidar a análise", "perfil de voz", "guia de estilo do influenciador", "juntar as análises num perfil", ou quando o objetivo for um artefato reutilizável para escrever copy no estilo de alguém. Recebe as análises já prontas OU as transcrições brutas — neste caso, produz as análises primeiro e depois sintetiza, funcionando sozinha de ponta a ponta.
---

# ig-perfil-comunicacao — Síntese do perfil de comunicação do criador

Esta é a **etapa de síntese**. As skills de análise (`ig-analise-ganchos`, `ig-analise-vocabulario`, `ig-analise-storytelling`, `ig-analise-retencao`) dissecam o criador em dimensões separadas. Esta skill **junta tudo num único perfil de comunicação** e salva como arquivo Markdown.

O perfil **não é um relatório para ler e esquecer**. É uma **ferramenta reutilizável**: o usuário vai entregá-lo depois, junto de uma copy qualquer, para a IA reescrever aquele texto na voz do influenciador. Por isso o perfil tem duas obrigações:
- **Prescritivo** — regras acionáveis ("faça X", "nunca Y"), não observações ("ele tende a...").
- **Autossuficiente** — precisa funcionar mesmo colado numa conversa nova, **sem** acesso às transcrições nem às outras skills. Tudo que importa precisa estar dentro do arquivo, ancorado em exemplos literais.

## Passo 0 — Carregar a lente (obrigatório)
Antes de sintetizar, leia `.claude/skills/ig-contexto/SKILL.md` e use a **gramática de viralização** como régua. O perfil descreve uma voz que funciona **no feed** (gancho, retenção, tom lo-fi, gatilhos, loops, cultura BR) — não uma voz de texto formal. Toda regra do perfil deve fazer sentido por essa régua.

## Passo 1 — Reunir o material
O input vem no próprio prompt e pode chegar de dois jeitos:

- **Análises já prontas** (saída das skills `ig-analise-*` coladas no prompt) → vá direto para o Passo 2 (síntese).
- **Só as transcrições brutas** (texto colado ou uma pasta apontada, ex.: `resources/videos/<criador>/`) → **primeiro produza as quatro análises**, depois sintetize. Para isso, aplique internamente, sobre o mesmo corpus, a lógica de cada skill: `ig-analise-ganchos`, `ig-analise-vocabulario`, `ig-analise-storytelling` e `ig-analise-retencao` (leia cada `SKILL.md` se precisar do método). Isso garante que a skill funcione **sozinha, de ponta a ponta**.

Se vierem transcrições, lembre da regra de ouro: **a consistência entre vários vídeos é o que define o perfil**. Um traço que aparece **uma vez é acidente**; o que **se repete entre vídeos é assinatura**. Priorize o recorrente; marque o que é pontual como pontual (ou descarte).

Se não estiver claro o que veio (análises prontas vs. transcrições) ou de onde vem o material, pergunte só isso.

## Passo 2 — Sintetizar (juntar as dimensões num perfil único)
Não basta empilhar as quatro análises. Síntese é destilar. Ao juntar:

- **Resolva sobreposições.** As dimensões se cruzam (um bordão de fechamento é gancho + vocabulário + retenção ao mesmo tempo). Cite cada traço **uma vez só**, no lugar **mais forte** dele. Nada de repetir o mesmo exemplo em três seções.
- **Priorize a assinatura.** Destaque o que **diferencia** essa voz de qualquer outra — o punhado de marcas que, juntas, tornam o criador reconhecível. O perfil não é um inventário neutro; é um retrato com hierarquia.
- **Ancore tudo em citações literais.** Cada regra e cada traço carrega pelo menos um **trecho real** entre aspas, como âncora de calibração. Sem exemplo literal, a regra é vaga demais para reescrever copy.
- **Defina o que evitar.** Tão importante quanto o que fazer: registre os **anti-padrões** — registro que destoa da voz, palavras que ele nunca usaria, ritmo errado. É isso que impede a IA de "escorregar" para um tom genérico.

## Passo 3 — Salvar o arquivo
Escreva o perfil como arquivo Markdown.
- **Nome:** use o nome/caminho que vier no prompt. Se nenhum for dado, salve como `perfil-comunicacao-<criador>.md` no diretório atual e **informe ao usuário onde salvou**.
- Preencha **todas** as seções do template abaixo. Toda seção de análise traz **exemplos literais** como âncora. Regras curtas e imperativas. Escreva o perfil de forma que ele se sustente sozinho.

## Template do perfil (estrutura fixa da saída)
Reproduza esta estrutura no arquivo, preenchendo com o conteúdo destilado do criador:

```markdown
# Perfil de Comunicação — <Criador>

> Como usar: entregue este perfil junto de uma copy e peça para reescrevê-la nesta voz. O perfil é autossuficiente — não precisa das transcrições originais.

## 1. Resumo da voz
2–4 linhas que capturam a voz de forma reconhecível: quem ele soa ser, com quem fala, com que energia. A "primeira impressão" da assinatura.

## 2. Princípios da voz
As poucas regras inegociáveis que governam tudo. Cada uma curta, imperativa, com seu porquê.
- **<Regra imperativa>** — _por quê:_ <o sinal da gramática de viralização que ela aciona / o efeito na voz>.
- (5 a 8 princípios; só o que é assinatura, não o óbvio.)

## 3. Gancho / abertura
Como ele abre. Os 2–4 moldes de gancho que ele repete, cada um com **exemplo literal** e quando usar.
- **<Tipo/molde de gancho>** — molde: "<trecho real>". Use quando <situação>.

## 4. Vocabulário e tom
- **Registro:** <íntimo / debochado / professoral / motivacional...>, consistente.
- **Formas de tratamento:** como chama o público ("<...>") e como se posiciona.
- **Bordões e expressões-assinatura:** "<trecho>", "<trecho>" (com onde costuma aparecer).
- **Gírias / palavrão:** quais e com que função (ênfase, humor, choque), com exemplo.
- **Evitar:** palavras, gírias e registros que **não** combinam com a voz (anti-padrões de léxico e tom).

## 5. Estrutura narrativa
O(s) molde(s) de roteiro assinatura (ex.: tese polêmica → história pessoal → lista → CTA de virada). Uso de personagens e do "você". Específico > abstrato, com **exemplo literal** do que é "específico" na voz dele.

## 6. Retenção e ritmo
As alavancas que ele repete (open loop, lista numerada, re-gancho, pattern interrupt), o padrão de fechamento/CTA e o ritmo de frase (curta/seca? longa/corrida?). Cada item com **exemplo literal**.
- **Evitar (ritmo):** o que quebra a cadência da voz (frase longa demais, formal demais, sem virada).

## 7. Banco de exemplos literais
Coletânea de trechos reais, agrupados por função (ganchos / bordões / fechamentos / specifics / viradas). Servem de calibração direta ao reescrever — quanto mais, melhor.

## 8. Como aplicar a uma copy
Passo a passo para reescrever um texto qualquer nesta voz:
1. <ex.: troque a abertura por um dos moldes de gancho da seção 3>.
2. <ex.: injete 1–2 bordões da seção 4 nos lugares naturais>.
3. <ex.: reestruture no molde narrativo da seção 5>.
4. <ex.: insira as alavancas de retenção e feche no padrão de CTA da seção 6>.
5. <ex.: passe a régua da lista "Evitar" e corte o que destoa>.

### Checklist de conformidade
Antes de entregar a copy reescrita, confirme:
- [ ] Abre com um molde de gancho da seção 3?
- [ ] Usa pelo menos um bordão-assinatura da seção 4?
- [ ] Segue o registro e o tom (e nada da lista "Evitar")?
- [ ] Tem a estrutura narrativa da seção 5?
- [ ] Tem alavanca de retenção e fecha no padrão de CTA da seção 6?
- [ ] Soa como os trechos do banco de exemplos (seção 7)?
```

## Lembretes finais
- **Prescritivo, não descritivo:** "Abra sempre com afirmação contra-intuitiva" — não "ele costuma abrir com afirmações".
- **Autossuficiente:** o arquivo precisa bastar sozinho. Se um trecho é essencial para calibrar a voz, ele tem que estar **dentro** do perfil.
- **Sempre ancorado em trechos reais.** Nada de "tom informal" genérico — cite o criador.
- **Síntese de verdade:** cada traço aparece uma vez, no lugar mais forte; a assinatura vem primeiro; o ruído fica de fora.
