# Lofi Pomodoro

Aplicação web simples de temporizador Pomodoro com visual minimalista e estilo "lofi".

## O que é

Esta aplicação ajuda a controlar ciclos de foco e pausas:

- Foco: 25 minutos
- Pausa curta: 5 minutos
- Pausa longa: 15 minutos

Ela também mostra o progresso em um círculo, avança automaticamente entre as fases e oferece avisos sonoros e notificações do navegador.

## Funcionalidades

- Temporizador Pomodoro com ciclo de fases
- Indicador visual do progresso
- Botões para iniciar, pausar, reiniciar e pular
- Teclas de atalho:
  - Espaço: iniciar/pausar
  - R: reiniciar
  - S: pular fase
- Playlist embutida do Spotify
- Sem dependências externas para a lógica do timer

## Como executar

Você pode abrir o arquivo `index.html` diretamente no navegador, ou rodar um pequeno servidor local:

```bash
cd /home/jonas/projects/html/pomodoro
python3 -m http.server 8000
```

Depois, acesse:

```text
http://localhost:8000
```

## Estrutura do projeto

- `index.html` — estrutura da interface
- `style.css` — estilos e tema visual
- `script.js` — lógica do temporizador e interações

## Observações

- A aplicação funciona como uma página estática.
- Para notificações do navegador, pode ser necessário permitir permissões no site.
- O áudio de alerta usa a Web Audio API do navegador.
