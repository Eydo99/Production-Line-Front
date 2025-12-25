import { Injectable } from '@angular/core';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: any;
  private readonly webSocketUrl = 'http://localhost:8080/ws';

  constructor() { }

  public connect(): void {
    const socket = new SockJS(this.webSocketUrl);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, (frame: any) => {
      console.log('Connected: ' + frame);
      this.stompClient.subscribe('/topic/pong', (message: any) => {
        console.log('Received: ', message.body);
      });
      this.stompClient.subscribe('/topic/queues', (message: any) => {
        console.log('Queue Update:', message.body);
      });
      this.stompClient.subscribe('/topic/machines', (message: any) => {
        console.log('Machine Update:', message.body);
      });
    }, (error: any) => {
      console.error('Error connecting to WebSocket', error);
    });
  }

  public sendPing(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send('/app/ping', {}, 'ping');
    } else {
      console.error('STOMP client is not connected.');
    }
  }

  public sendTestQueue(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send('/app/test/queue', {}, {});
    }
  }

  public sendTestMachine(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send('/app/test/machine', {}, {});
    }
  }

  public disconnect(): void {
    if (this.stompClient !== null) {
      this.stompClient.disconnect();
    }
    console.log("Disconnected");
  }
}
