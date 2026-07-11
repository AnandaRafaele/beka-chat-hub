import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class Chat {
  private readonly socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  public sendMessage(message: string): void {
    this.socket.emit('client_message', message);
  }

  public getMessages(): Observable<string> {
    return new Observable((subscriber) => {
      const handler = (data: string) => subscriber.next(data);
      this.socket.on('server_message', handler);
      return () => {
        this.socket.off('server_message', handler);
      };
    });
  }
}
