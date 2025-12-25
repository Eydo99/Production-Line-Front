import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

export interface QueueUpdate {
  queueId: string;
  currentSize: number;
}

export interface MachineUpdate {
  machineId: string;
  status: string;
  productColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: any;
  private readonly webSocketUrl = 'http://localhost:8080/ws';

  // Observables for components to subscribe
  public queueUpdates$ = new Subject<QueueUpdate>();
  public machineUpdates$ = new Subject<MachineUpdate>();

  constructor() { }

  public connect(): void {
    const socket = new SockJS(this.webSocketUrl);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, (frame: any) => {
      console.log('✅ WebSocket Connected:', frame);
      
      // Subscribe to queue updates
      this.stompClient.subscribe('/topic/queues', (message: any) => {
        const update = JSON.parse(message.body);
        console.log('📦 Queue Update:', update);
        this.queueUpdates$.next(update);
      });
      
      // Subscribe to machine updates
      this.stompClient.subscribe('/topic/machines', (message: any) => {
        const update = JSON.parse(message.body);
        console.log('⚙️ Machine Update:', update);
        this.machineUpdates$.next(update);
      });
    }, (error: any) => {
      console.error('❌ WebSocket Error:', error);
    });
  }

  public sendTestQueue(): void {
    if (this.stompClient?.connected) {
      this.stompClient.send('/app/test/queue', {}, {});
    }
  }

  public sendTestMachine(): void {
    if (this.stompClient?.connected) {
      this.stompClient.send('/app/test/machine', {}, {});
    }
  }

  public disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect();
      console.log("Disconnected");
    }
  }

public sendPing(): void {
  if (this.stompClient?.connected) {
    this.stompClient.send('/app/ping', {}, JSON.stringify({ type: 'ping' }));
  }
}

}