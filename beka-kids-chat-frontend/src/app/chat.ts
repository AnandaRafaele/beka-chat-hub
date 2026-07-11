import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class Chat {
  private readonly socket: Socket;
  private readonly messages$ = new ReplaySubject<string>(1);

  constructor() {
    this.socket = io('http://localhost:3000');
    this.socket.on('server_message', (data: string) => {
      this.messages$.next(data);
    });
  }

  public sendMessage(message: string): void {
    this.socket.emit('client_message', message);
  }

  public getMessages(): Observable<string> {
    return this.messages$.asObservable();
  }
}
