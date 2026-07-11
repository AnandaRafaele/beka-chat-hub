/** Espelha os estágios do backend (`server.js`) — só para clientes. */
export const STAGE = {
  TRIAGE: 'triage',
  WAITING_ATTENDANT: 'waiting_attendant',
  IN_ATTENDANCE: 'in_attendance',
  FINISHED: 'finished',
} as const;

export type Stage = (typeof STAGE)[keyof typeof STAGE];

export const STAGE_LABEL: Record<Stage, string> = {
  [STAGE.TRIAGE]: 'Em triagem',
  [STAGE.WAITING_ATTENDANT]: 'Aguardando atendimento...',
  [STAGE.IN_ATTENDANCE]: 'Em atendimento',
  [STAGE.FINISHED]: 'Encerrado',
};

const QUEUE_ITEM_BASE =
  'w-full cursor-pointer rounded-2xl border border-l-4 px-4 py-3.5 text-left transition-[transform,background-color,box-shadow,border-color] hover:-translate-y-px hover:shadow-[0_8px_20px_rgb(42_31_26_/0.08)]';

export const QUEUE_ITEM_CLASS: Record<Stage, string> = {
  [STAGE.TRIAGE]: `${QUEUE_ITEM_BASE} border-beka-ink/5 border-l-beka-soft bg-beka-paper hover:bg-[#f5ebe3]`,
  [STAGE.WAITING_ATTENDANT]: `${QUEUE_ITEM_BASE} border-beka-deep/15 border-l-beka-deep bg-beka-bot hover:bg-[#ffe4d4]`,
  [STAGE.IN_ATTENDANCE]: `${QUEUE_ITEM_BASE} border-beka-coral/20 border-l-beka-coral bg-[#fff4ee] hover:bg-[#ffe8dc]`,
  [STAGE.FINISHED]: `${QUEUE_ITEM_BASE} border-beka-ink/5 border-l-beka-soft/50 bg-beka-paper/80 opacity-70 hover:opacity-90 hover:bg-beka-paper`,
};

export const QUEUE_ITEM_SELECTED =
  'ring-2 ring-beka-blush ring-offset-2 ring-offset-white';

/** Item da fila enviado pelo backend. */
export interface QueueClient {
  id: string;
  stage: Stage;
}

/** Papéis no socket / sala (alinhado ao backend + system). */
export const ROLE = {
  CLIENT: 'client',
  ATTENDANT: 'attendant',
  SYSTEM: 'system',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

/** Remetente das bolhas no chat do cliente. */
export const MESSAGE_SENDER = {
  BOT: 'bot',
  USER: 'user',
  SYSTEM: 'system',
} as const;

export type MessageSender = (typeof MESSAGE_SENDER)[keyof typeof MESSAGE_SENDER];

const CLIENT_BUBBLE_BASE =
  'animate-pop max-w-[min(85%,28rem)] break-words whitespace-pre-wrap rounded-[1.15rem] px-4 py-3.5';

export const CLIENT_BUBBLE_CLASS: Record<MessageSender, string> = {
  [MESSAGE_SENDER.BOT]: `${CLIENT_BUBBLE_BASE} mr-auto rounded-bl-md bg-beka-bot`,
  [MESSAGE_SENDER.USER]: `${CLIENT_BUBBLE_BASE} ml-auto rounded-br-md bg-gradient-to-br from-beka-blush to-beka-deep text-white`,
  [MESSAGE_SENDER.SYSTEM]: `${CLIENT_BUBBLE_BASE} mx-auto bg-transparent text-center text-sm text-beka-soft`,
};

const ATTENDANT_BUBBLE_BASE =
  'animate-pop max-w-[min(80%,32rem)] rounded-[1.15rem] px-4 py-3.5 text-[0.98rem] leading-snug';

export const ATTENDANT_BUBBLE_CLASS: Record<Role, string> = {
  [ROLE.CLIENT]: `${ATTENDANT_BUBBLE_BASE} self-start rounded-bl-md bg-beka-bot text-beka-ink`,
  [ROLE.ATTENDANT]: `${ATTENDANT_BUBBLE_BASE} self-end rounded-br-md bg-gradient-to-br from-beka-blush to-beka-deep text-white`,
  [ROLE.SYSTEM]: `${ATTENDANT_BUBBLE_BASE} self-start bg-transparent text-center text-sm text-beka-soft`,
};
