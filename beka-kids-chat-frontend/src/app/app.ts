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
import { Chat } from './chat';

export type ChatRole = 'bot' | 'user' | 'system';

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private readonly chat = inject(Chat);
  private readonly messagesEl = viewChild<ElementRef<HTMLElement>>('messageList');
  private subscription?: Subscription;
  private nextId = 0;

  protected readonly draft = signal('');
  protected readonly messages = signal<ChatMessage[]>([]);

  ngOnInit(): void {
    this.subscription = this.chat.getMessages().subscribe((text) => {
      this.pushMessage('bot', text);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text) return;

    this.pushMessage('user', text);
    this.chat.sendMessage(text);
    this.draft.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private pushMessage(role: ChatRole, text: string): void {
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
