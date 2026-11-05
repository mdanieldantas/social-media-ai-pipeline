# Geração do Perfil de Comunicação da Hanah

## Tarefas

### Fase 1: obteção dos dados

- [ ] Obter a lista de vídeos do instagram da conta @hanahfranklin usando o MCP `resources/mcps/instagram-videos`
- [ ] Obter os 10 melhores vídeos do instagram da conta @hanahfranklin usando o MCP `resources/mcps/instagram-top-videos-download`
- [ ] Transcrever os vídeo usando o MCP `resources/mcps/video-transcricao`

### Fase 2: análise das transcrições

- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-ganchos` e criar um arquivo para armazenar o resultado da análise em `ig-analise-ganchos.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-retencao` e criar um arquivo para armazenar o resultado da análise em `ig-analise-retencao.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-storytelling` e criar um arquivo para armazenar o resultado da análise em `ig-analise-storytelling.md`
- [ ] Dentro da pasta das transcrições executar a skill `.claude/skills/ig-analise-vocabulario` e criar um arquivo para armazenar o resultado da análise em `ig-analise-vocabulario.md`
- [ ] Gere o arquivo final de perfil de comunicação usando a skill `.claude/skills/ig-perfil-comunicacao` com base nas análises anteriores
