# video-transcricao (MCP)

MCP server que transcreve vídeos para texto usando a API da OpenAI ou OpenRouter.

## O que faz

- Transcreve **um vídeo específico** (`transcrever_video`) ou **uma pasta inteira** de vídeos (`transcrever_pasta`).
- Para cada vídeo, salva a transcrição em um `.txt` **ao lado do próprio vídeo**, com o mesmo nome base, contendo **apenas o texto falado** (sem cabeçalho nem metadados).
- Extrai o áudio antes de enviar para a API, reencodando em **Opus mono 16 kHz ~16 kbps** (otimizado para voz) — arquivos minúsculos sem perder a clareza da fala.
- Usa um **ffmpeg/ffprobe portáveis** (binários estáticos via npm): funciona em qualquer SO sem instalar nada no sistema.
- Respeita o **limite de 25 MB** da API: se o áudio passar do limite, ele é dividido em partes automaticamente e as transcrições são juntadas.

## Configuracao

Crie `.env` na pasta deste MCP (ao lado de `index.js`), usando `.env.example` como referencia:

```dotenv
TRANSCRIBE_PROVIDER=openrouter
OPENROUTER_API_KEY=sua-chave-openrouter
OPENROUTER_TRANSCRIBE_MODEL=openai/whisper-1
```

O modelo precisa oferecer **speech-to-text (STT)**; modelos apenas de chat nao servem.
Documentacao: https://openrouter.ai/docs/guides/overview/multimodal/stt
O audio e enviado ao OpenRouter e ao provedor do modelo escolhido. O uso depende de saldo e acesso nesse servico.

Para continuar usando OpenAI:

```dotenv
TRANSCRIBE_PROVIDER=openai
OPENAI_API_KEY=sua-chave-openai
OPENAI_TRANSCRIBE_MODEL=whisper-1
```

Sem `TRANSCRIBE_PROVIDER`, usa OpenAI por compatibilidade; se apenas a chave
OpenRouter estiver definida, usa OpenRouter. Com ambas as chaves, selecione
explicitamente `openrouter` para usa-lo. Nao existe fallback automatico entre provedores.
Reinicie o MCP depois de alterar o `.env`. A busca pelo arquivo comeca na pasta
do MCP e sobe pelos diretorios pais; usa o diretorio atual como alternativa.

As respostas JSON das APIs sao convertidas para texto simples no `.txt`.
Erros HTTP mostram o provedor e o status, sem expor a chave. Falhas de rede e
saldo insuficiente sao informadas separadamente.

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
