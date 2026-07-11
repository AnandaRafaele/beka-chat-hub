# Beka Chat Hub

Hub de atendimento da **Beka Kids**: um lobby de chat em tempo real com triagem automática e handover para atendente humana.

## Estrutura

```
beka-chat-hub/
├── beka-kids-chat-backend/   # Fastify + Socket.IO (porta 3000)
└── beka-kids-chat-frontend/  # Angular + socket.io-client (porta 4200)
```

| Pasta | Stack | Função |
|-------|--------|--------|
| `beka-kids-chat-backend` | Node.js, Fastify, Socket.IO | Lobby, menu de triagem e estados da sessão |
| `beka-kids-chat-frontend` | Angular 21, RxJS, Socket.IO Client | Interface de chat conectada ao lobby |

## Pré-requisitos

- Node.js 18+ (recomendado 20+)
- npm 10+

## Como rodar

Abra **dois terminais**.

### 1. Backend

```bash
cd beka-kids-chat-backend
npm install
node server.js
```

Servidor em `http://localhost:3000`.  
Health check: `GET /` → `{ "status": "Beka Kids Lobby Engine running at 100%!" }`.

### 2. Frontend

```bash
cd beka-kids-chat-frontend
npm install
npm start
```

App em `http://localhost:4200`.

## Fluxo do atendimento

1. O cliente conecta via Socket.IO.
2. O servidor envia o **menu inicial** (`INITIAL_MENU`).
3. Em triagem (`stage: triage`):
   - **1** — Dúvidas sobre tamanhos ou disponibilidade (hoje reexibe o menu)
   - **2** — Status e rastreio do pedido (hoje reexibe o menu)
   - **3** — Transfere para atendente humana (`stage: human_attendant`)
4. Em atendimento humano, as mensagens do cliente são apenas registradas no log do servidor (aguardando integração com painel/atendente).

## Eventos Socket.IO

| Direção | Evento | Payload | Descrição |
|---------|--------|---------|-----------|
| Cliente → Servidor | `client_message` | `string` | Mensagem digitada pelo usuário |
| Servidor → Cliente | `server_message` | `string` | Resposta do bot / sistema |

O frontend usa o serviço `Chat` (`beka-kids-chat-frontend/src/app/chat.ts`) para emitir e escutar esses eventos.

## Desenvolvimento

### Backend

- Entrada: `beka-kids-chat-backend/server.js`
- Estado por socket em memória (`clientStates`)
- CORS liberado (`origin: '*'`) — restringir em produção

### Frontend

```bash
cd beka-kids-chat-frontend
npm start    # ng serve
npm run build
npm test
```

Arquivos principais:

- `src/app/app.ts` / `app.html` / `app.css` — UI do chat
- `src/app/chat.ts` — cliente Socket.IO

O frontend aponta para `http://localhost:3000`. Se mudar a URL do backend, atualize `chat.ts`.

## Roadmap sugerido

- [ ] Fluxos reais para opções **1** e **2** (estoque / pedidos)
- [ ] Painel para atendentes receberem o handover
- [ ] Persistência de conversas (banco)
- [ ] Autenticação e CORS restrito em produção
- [ ] Variáveis de ambiente para URL do Socket.IO

## Licença

ISC (backend). Frontend gerado com Angular CLI.
