import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Chat, RoomMessage } from '../chat';
import {
  ATTENDANT_BUBBLE_CLASS,
  QUEUE_ITEM_CLASS,
  QUEUE_ITEM_SELECTED,
  QueueClient,
  ROLE,
  Role,
  STAGE,
  STAGE_LABEL,
  Stage,
} from '../constants';

export interface AttendantChatMessage {
  id: number;
  from: Role;
  text: string;
}

@Component({
  selector: 'app-attendant',
  imports: [FormsModule],
  templateUrl: './attendant.html',
  styleUrl: './attendant.css',
})
export class Attendant implements OnInit, OnDestroy {
  private readonly chat = inject(Chat);
  private waitingListSub?: Subscription;
  private roomSub?: Subscription;
  private nextId = 0;

  protected readonly bubbleClass = ATTENDANT_BUBBLE_CLASS;
  protected readonly queue = signal<QueueClient[]>([]);
  protected readonly selectedClient = signal<string | null>(null);
  protected readonly messages = signal<AttendantChatMessage[]>([]);
  // TODO: refatorar para usar o draft do chat
  protected readonly draft = signal('');

  ngOnInit(): void {
    this.chat.registerAttendant();

    this.waitingListSub = this.chat.getWaitingList().subscribe((newQueue) => {
      this.queue.set(newQueue);
    });

    this.roomSub = this.chat.getRoomMessages().subscribe((msg) => {
      this.handleRoomMessage(msg);
    });
  }

  ngOnDestroy(): void {
    this.waitingListSub?.unsubscribe();
    this.roomSub?.unsubscribe();
  }

  protected shortId(socketId: string): string {
    return socketId.slice(0, 6).toUpperCase();
  }

  protected stageLabel(stage: Stage): string {
    return STAGE_LABEL[stage] ?? stage;
  }

  protected queueItemClass(client: QueueClient): string {
    const base = QUEUE_ITEM_CLASS[client.stage] ?? QUEUE_ITEM_CLASS[STAGE.TRIAGE];
    return this.selectedClient() === client.id
      ? `${base} ${QUEUE_ITEM_SELECTED}`
      : base;
  }

  protected attendTo(client: QueueClient): void {
    this.selectedClient.set(client.id);
    this.messages.set([
      {
        id: this.nextId++,
        from: ROLE.SYSTEM,
        text: `Atendimento iniciado com Cliente #${this.shortId(client.id)}.`,
      },
    ]);

    // Só dispara start_attending se ainda estiver aguardando
    if (client.stage === STAGE.WAITING_ATTENDANT) {
      this.chat.startAttending(client.id);
    }
  }

  protected send(): void {
    const clientId = this.selectedClient();
    const text = this.draft().trim();
    if (!clientId || !text) return;

    this.messages.update((list) => [
      ...list,
      { id: this.nextId++, from: ROLE.ATTENDANT, text },
    ]);
    this.chat.sendAttendantMessage(clientId, text);
    this.draft.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private handleRoomMessage(msg: RoomMessage): void {
    const selected = this.selectedClient();
    if (!selected) return;

    const relevant =
      msg.sender === selected ||
      msg.sender === ROLE.SYSTEM ||
      msg.role === ROLE.ATTENDANT;

    if (!relevant) return;

    if (msg.role === ROLE.ATTENDANT || msg.sender === this.chat.socketId) {
      return;
    }

    const from: Role =
      msg.sender === ROLE.SYSTEM || msg.role === ROLE.SYSTEM
        ? ROLE.SYSTEM
        : ROLE.CLIENT;

    this.messages.update((list) => [
      ...list,
      { id: this.nextId++, from, text: msg.message },
    ]);
  }
}
