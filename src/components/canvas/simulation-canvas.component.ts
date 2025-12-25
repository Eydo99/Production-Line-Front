import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { QueueService, QueueModel } from '../../services/queue.service';
import { WebSocketService } from '../../services/websocket.service';
import { QueueNodeComponent } from './queue-node/queue-node.component';

@Component({
  selector: 'app-simulation-canvas',
  standalone: true,
  imports: [CommonModule, QueueNodeComponent],
  templateUrl: './simulation-canvas.component.html',
  styleUrls: ['./simulation-canvas.component.css']
})
export class SimulationCanvasComponent implements OnInit, OnDestroy {

  queues: QueueModel[] = [];
  private queueUpdateSub?: Subscription;

  constructor(
    private queueService: QueueService,
    private wsService: WebSocketService
  ) {}

  ngOnInit() {
    this.loadQueues();
    this.subscribeToUpdates();
  }

  ngOnDestroy() {
    this.queueUpdateSub?.unsubscribe();
  }

  loadQueues() {
    this.queueService.getQueues().subscribe(q => {
      console.log('📋 Loaded queues:', q);
      this.queues = q;
    });
  }

  addQueue() {
    const randomX = Math.floor(Math.random() * 400) + 100;
    const randomY = Math.floor(Math.random() * 300) + 100;
    
    this.queueService.createQueue(randomX, randomY).subscribe(queue => {
      console.log('➕ Queue created:', queue);
      this.queues.push(queue);
    });
  }

  onMoved(queue: QueueModel, pos: { x: number; y: number }) {
    queue.x = pos.x;
    queue.y = pos.y;
    this.queueService.updatePosition(queue.id, pos.x, pos.y).subscribe();
  }

  // 🔥 Real-time updates from WebSocket
  private subscribeToUpdates() {
    this.queueUpdateSub = this.wsService.queueUpdates$.subscribe(update => {
      const queue = this.queues.find(q => q.id === update.queueId);
      if (queue) {
        queue.size = update.currentSize;
        console.log(`📦 Updated ${queue.id} size: ${queue.size}`);
      }
    });
  }
}