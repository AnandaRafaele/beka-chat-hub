import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Chat } from '../chat';
import { MESSAGE_SENDER, MessageSender, CLIENT_BUBBLE_CLASS } from '../constants';

export interface ChatMessage {
  id: number;
  role: MessageSender;
  text: string;
}

const WELCOME_MENU = `Olá! Bem-vindo à Beka Kids! 🧸
Como podemos ajudar quem você mais ama hoje?
1️⃣ - Dúvidas sobre tamanhos ou disponibilidade
2️⃣ - Status e rastreio do meu pedido
3️⃣ - Falar com uma de nossas atendentes`;

@Component({
  selector: 'app-client',
  imports: [FormsModule],
  templateUrl: './client.html',
  styleUrl: './client.css',
})
export class Client implements OnInit, OnDestroy {
  private readonly chat = inject(Chat);
  private readonly messagesEl = viewChild<ElementRef<HTMLElement>>('messageList');
  private subscription?: Subscription;
  private nextId = 0;

  protected readonly bubbleClass = CLIENT_BUBBLE_CLASS;
  protected readonly draft = signal('');
  protected readonly messages = signal<ChatMessage[]>([
    { id: this.nextId++, role: MESSAGE_SENDER.BOT, text: WELCOME_MENU },
  ]);

  ngOnInit(): void {
    this.chat.registerClient();

    this.subscription = this.chat.getMessages().subscribe((text) => {
      if (text === WELCOME_MENU && this.messages().some((m) => m.text === WELCOME_MENU)) {
        return;
      }
      this.pushMessage(MESSAGE_SENDER.BOT, text);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text) return;

    this.pushMessage(MESSAGE_SENDER.USER, text);
    this.chat.sendMessage(text);
    this.draft.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private pushMessage(role: MessageSender, text: string): void {
    this.messages.update((list) => [
      ...list,
      { id: this.nextId++, role, text },
    ]);
    queueMicrotask(() => this.scrollToBottom());
  }

  private scrollToBottom(): void {
    const el = this.messagesEl()?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
