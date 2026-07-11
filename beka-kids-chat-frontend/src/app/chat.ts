import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ROLE, Role, QueueClient } from './constants';

export interface RoomMessage {
  sender: string;
  message: string;
  role?: Role;
}

@Injectable({
  providedIn: 'root',
})
export class Chat {
  private readonly zone = inject(NgZone);
  private readonly socket: Socket;
  private readonly messages$ = new Subject<string>();
  private readonly roomMessages$ = new Subject<RoomMessage>();

  constructor() {
    this.socket = io('http://localhost:3000');
    this.socket.on('server_message', (data: string) => {
      this.zone.run(() => this.messages$.next(data));
    });
    this.socket.on('room_message', (data: RoomMessage) => {
      this.zone.run(() => {
        this.roomMessages$.next(data);
        if (data.role === ROLE.ATTENDANT) {
          this.messages$.next(data.message);
        }
      });
    });
  }

  public get socketId(): string {
    return this.socket.id ?? '';
  }

  public sendMessage(message: string): void {
    this.socket.emit('client_message', message);
  }

  public getMessages(): Observable<string> {
    return this.messages$.asObservable();
  }

  public getRoomMessages(): Observable<RoomMessage> {
    return this.roomMessages$.asObservable();
  }

  public registerAttendant(): void {
    this.socket.emit('register_attendant');
  }

  public registerClient(): void {
    this.socket.emit('register_client');
  }

  public getWaitingList(): Observable<QueueClient[]> {
    return new Observable((observer) => {
      const handler = (fila: QueueClient[]) => {
        this.zone.run(() => observer.next(fila));
      };
      this.socket.on('waiting_list_update', handler);
      return () => {
        this.socket.off('waiting_list_update', handler);
      };
    });
  }

  public startAttending(clientId: string): void {
    this.socket.emit('start_attending', clientId);
  }

  public sendAttendantMessage(clientId: string, message: string): void {
    this.socket.emit('attendant_message', { clientId, message });
  }

  public finishAttending(clientId: string): void {
    this.socket.emit('finish_attendant', clientId);
  }
}
