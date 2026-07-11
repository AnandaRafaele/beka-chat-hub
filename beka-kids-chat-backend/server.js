const fastify = require('fastify')({
  logger: true,
});
const { Server } = require('socket.io');

const STAGE = Object.freeze({
  TRIAGE: 'triage',
  WAITING_ATTENDANT: 'waiting_attendant',
  IN_ATTENDANCE: 'in_attendance',
  FINISHED: 'finished',
});

const ROLE = Object.freeze({
  CLIENT: 'client',
  ATTENDANT: 'attendant',
});

const clientStates = {};
let waitingList = [];
let io = null;

function broadcastWaitingList() {
  if (!io) return;
  io.emit('waiting_list_update', waitingList);
}

function setClientStage(socketId, stage) {
  const session = clientStates[socketId];
  if (session) {
    session.stage = stage;
  }

  const item = waitingList.find((entry) => entry.id === socketId);
  if (item) {
    item.stage = stage;
  }
}

function addToWaitingList(socketId, stage = STAGE.WAITING_ATTENDANT) {
  const existing = waitingList.find((entry) => entry.id === socketId);
  if (existing) {
    existing.stage = stage;
    return;
  }
  waitingList.push({ id: socketId, stage });
}

function removeFromWaitingList(socketId) {
  const before = waitingList.length;
  waitingList = waitingList.filter((entry) => entry.id !== socketId);
  return waitingList.length !== before;
}

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', // TODO: restringir ao frontend em produção
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    fastify.log.info(`🔌 Conectado: ${socket.id}`);

    clientStates[socket.id] = { stage: STAGE.TRIAGE, role: ROLE.CLIENT };

    socket.on('client_message', (message) => {
      const session = clientStates[socket.id];
      if (!session || session.role === ROLE.ATTENDANT) return;

      const text = String(message ?? '').trim();

      if (session.stage === STAGE.TRIAGE) {
        if (text === '1') {
          socket.emit(
            'server_message',
            'Claro! Para dúvidas de tamanho ou disponibilidade, me diga o nome do produto (ou envie o link) e a idade/tamanho da criança. Em breve nossa equipe confirma o estoque pra você. 👗',
          );
          return;
        }

        if (text === '2') {
          socket.emit(
            'server_message',
            'Perfeito! Para rastrear seu pedido, envie o número do pedido ou o e-mail usado na compra. Vamos localizar o status pra você. 📦',
          );
          return;
        }

        if (text === '3') {
          setClientStage(socket.id, STAGE.WAITING_ATTENDANT);
          socket.join(socket.id);
          addToWaitingList(socket.id, STAGE.WAITING_ATTENDANT);

          socket.emit(
            'server_message',
            'Transferindo você para uma de nossas atendentes... Aguarde um momento! 👩‍💻',
          );
          fastify.log.info(`🔄 Handover: ${socket.id}`);
          broadcastWaitingList();
          return;
        }

        socket.emit(
          'server_message',
          'Não entendi essa opção. Digite 1️⃣, 2️⃣ ou 3️⃣ para continuar.',
        );
        return;
      }

      if (session.stage === STAGE.WAITING_ATTENDANT) {
        socket.emit(
          'server_message',
          'Aguarde um momentinho — já estamos te direcionando para uma atendente. 👩‍💻',
        );
        return;
      }

      if (session.stage === STAGE.IN_ATTENDANCE) {
        io.to(socket.id).emit('room_message', {
          sender: socket.id,
          message: text,
          role: ROLE.CLIENT,
        });
        return;
      }

      if (session.stage === STAGE.FINISHED) {
        socket.emit(
          'server_message',
          'Este atendimento já foi encerrado. Se precisar de algo mais, digite 3️⃣ para falar com uma atendente.',
        );
      }
    });

    socket.on('attendant_message', ({ clientId, message }) => {
      if (!clientId || !message) return;
      const text = String(message).trim();
      if (!text) return;

      io.to(clientId).emit('room_message', {
        sender: socket.id,
        message: text,
        role: ROLE.ATTENDANT,
      });
    });

    socket.on('finish_attendant', (clientId) => {
      if (!clientId || !clientStates[clientId]) return;

      setClientStage(clientId, STAGE.FINISHED);
      broadcastWaitingList();

      io.to(clientId).emit(
        'server_message',
        'Atendimento encerrado. Obrigada pelo contato com a Beka Kids! 🧸',
      );
      fastify.log.info(`✅ Atendimento finalizado: ${clientId}`);
    });

    socket.on('register_attendant', () => {
      clientStates[socket.id] = { role: ROLE.ATTENDANT };

      removeFromWaitingList(socket.id);
      fastify.log.info(`👩‍💻 Atendente registrada: ${socket.id}`);
      socket.emit('waiting_list_update', waitingList);
    });

    socket.on('register_client', () => {
      clientStates[socket.id] = { stage: STAGE.TRIAGE, role: ROLE.CLIENT };
      removeFromWaitingList(socket.id);
      fastify.log.info(`🧸 Cliente registrado: ${socket.id}`);
    });

    socket.on('start_attending', (clientId) => {
      if (!clientId || typeof clientId !== 'string') return;

      const clientSession = clientStates[clientId];
      if (!clientSession || clientSession.role === ROLE.ATTENDANT) {
        fastify.log.warn(`⚠️ start_attending: cliente inválido ${clientId}`);
        return;
      }

      // Mantém na lista e só atualiza o stage
      setClientStage(clientId, STAGE.IN_ATTENDANCE);
      clientSession.attendantId = socket.id;

      socket.join(clientId);
      broadcastWaitingList();

      io.to(clientId).emit(
        'server_message',
        'Uma atendente entrou na conversa. Em que podemos ajudar? 👩‍💻',
      );

      fastify.log.info(
        `👩‍💻 Atendente ${socket.id} iniciou atendimento com ${clientId}`,
      );
    });

    socket.on('disconnect', () => {
      const session = clientStates[socket.id];
      const wasInList = removeFromWaitingList(socket.id);

      if (session?.role !== ROLE.ATTENDANT && wasInList) {
        broadcastWaitingList();
      }

      if (session?.attendantId) {
        io.to(socket.id).emit('room_message', {
          sender: 'system',
          message: 'Cliente desconectou.',
          role: 'system',
        });
      }

      delete clientStates[socket.id];
      fastify.log.info(`🚪 Saiu: ${socket.id}`);
    });
  });
}

fastify.get('/', (_req, reply) => {
  return { status: 'Beka Kids Lobby Engine running at 100%!' };
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  setupSocket(fastify.server);
  console.log(`Server is running on ${address}`);
});
