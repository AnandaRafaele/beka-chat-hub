const fastify = require('fastify')({
    logger: true
});
const fastifySocketIo = require('fastify-socket.io');

// Ajuste CORS e métodos para abranger futuras configurações de segurança
fastify.register(fastifySocketIo, {
    cors: {
        origin: '*', // TODO: Restringir para endereço do frontend em produção
        methods: ['GET', 'POST']
    }
});

// Memória temporária para status do cliente
const clientStates = {};

// Menu inicial do Beka Kids
const INITIAL_MENU = `Olá! Bem-vindo à Beka Kids! 🧸
Como podemos ajudar quem você mais ama hoje?
1️⃣ - Dúvidas sobre tamanhos ou disponibilidade
2️⃣ - Status e rastreio do meu pedido
3️⃣ - Falar com uma de nossas atendentes`;

// Inicialização do servidor e eventos de conexão socket.io
fastify.ready(err => {
    if (err) throw err;

    fastify.io.on('connection', socket => {
        fastify.log.info(`🔌 Novo cliente conectado! ID: ${socket.id}`);

        // Cliente entra em estágio inicial ("triagem")
        clientStates[socket.id] = { stage: 'triage' };
        socket.emit('server_message', INITIAL_MENU);

        // Recebe mensagens do cliente
        socket.on('client_message', message => {
            const session = clientStates[socket.id];
            if (!session) return; // Segurança: ignora mensagens após desconexão

            if (session.stage === 'triage') {
                if (message.trim() === '3') {
                    session.stage = 'human_attendant';
                    socket.emit('server_message', 'Transferindo você para uma de nossas atendentes... Aguarde um momento! 👩‍💻');
                    fastify.log.info(`🔄 Handover acionado para: ${socket.id}`);
                } else {
                    // Sempre retorna ao menu na triagem, independentemente da opção
                    socket.emit('server_message', INITIAL_MENU);
                }
            } else {
                // Quando em atendimento humano, loga a mensagem apenas
                fastify.log.info(`Mensagem aguardando atendente (${socket.id}): ${message}`);
            }
        });

        // Evento de desconexão do cliente
        socket.on('disconnect', () => {
            delete clientStates[socket.id];
            fastify.log.info(`🚪 Cliente saiu: ${socket.id}`);
        });
    });
});

// Endpoint raiz para verificação do status do servidor
fastify.get('/', (req, reply) => {
    return { status: 'Beka Kids Lobby Engine running at 100%!' };
});

// Inicialização do servidor HTTP na porta 3000
fastify.listen({ port: 3000 }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`Server is running on ${address}`);
});