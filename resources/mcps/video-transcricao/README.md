# video-transcricao (MCP)

MCP server que transcreve vídeos para texto usando a API da OpenAI.

## O que faz

- Transcreve **um vídeo específico** (`transcrever_video`) ou **uma pasta inteira** de vídeos (`transcrever_pasta`).
- Para cada vídeo, salva a transcrição em um `.txt` **ao lado do próprio vídeo**, com o mesmo nome base, contendo **apenas o texto falado** (sem cabeçalho nem metadados).
- Extrai o áudio antes de enviar para a API, reencodando em **Opus mono 16 kHz ~16 kbps** (otimizado para voz) — arquivos minúsculos sem perder a clareza da fala.
- Usa um **ffmpeg/ffprobe portáveis** (binários estáticos via npm): funciona em qualquer SO sem instalar nada no sistema.
- Respeita o **limite de 25 MB** da API: se o áudio passar do limite, ele é dividido em partes automaticamente e as transcrições são juntadas.

## Configuração

Crie um arquivo `.env` na **raiz do projeto** com a chave da OpenAI:

```
OPENAI_API_KEY=sk-...
# opcional: escolher o modelo de transcrição (padrão: whisper-1)
# OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

Se a chave não estiver configurada, o MCP devolve uma mensagem clara explicando como corrigir.

## Tools

### `transcrever_video`
- `videoPath` (string): caminho do arquivo de vídeo.
- `force` (boolean, opcional): refaz a transcrição mesmo que o `.txt` já exista.

### `transcrever_pasta`
- `folderPath` (string): caminho da pasta com os vídeos.
- `force` (boolean, opcional): refaz todos, mesmo os já transcritos.
- `recursive` (boolean, opcional): inclui subpastas.

Em pastas, vídeos já transcritos são **pulados** (a menos que `force=true`) e erros em um vídeo específico são **ignorados**, continuando com os demais.

## Instalação

```
cd resources/mcps/video-transcricao
npm install
```
