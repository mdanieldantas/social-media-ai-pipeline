# Geração do Perfil de Comunicação de {{NOME}}

> Template de geração de perfil de influenciador.
> Substitua os placeholders antes de usar:
> - `{{NOME}}`: nome do criador (ex: Micha Menezes)
> - `{{CONTA}}`: @ da conta no Instagram, sem o @ (ex: michamenezes)
> - `{{SLUG}}`: identificador curto usado em pastas e arquivos (ex: michamenezes)

## Tarefas

### Fase 1: obtenção dos dados

- [ ] Obter a lista de vídeos do instagram da conta @{{CONTA}} usando o MCP `resources/mcps/instagram-videos`
- [ ] Obter os 10 melhores vídeos do instagram da conta @{{CONTA}} usando o MCP `resources/mcps/instagram-top-videos-download`
- [ ] Transcrever os vídeos usando o MCP `resources/mcps/video-transcricao`

### Fase 2: análise das transcrições

- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-ganchos` e criar um arquivo para armazenar o resultado da análise em `ig-analise-ganchos.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-retencao` e criar um arquivo para armazenar o resultado da análise em `ig-analise-retencao.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-storytelling` e criar um arquivo para armazenar o resultado da análise em `ig-analise-storytelling.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-vocabulario` e criar um arquivo para armazenar o resultado da análise em `ig-analise-vocabulario.md`
- [ ] Gere o arquivo final de perfil de comunicação usando a skill `.claude/skills/ig-perfil-comunicacao` com base nas análises anteriores no arquivo `perfil-{{SLUG}}.md`
