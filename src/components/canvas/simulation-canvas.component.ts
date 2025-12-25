import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueService, QueueModel } from '../../services/queue.service';
import { QueueNodeComponent } from './queue-node/queue-node.component';

@Component({
  selector: 'app-simulation-canvas',
  standalone: true,
  imports: [CommonModule, QueueNodeComponent],
  templateUrl: './simulation-canvas.component.html',
  styleUrls: ['./simulation-canvas.component.css']
})
export class SimulationCanvasComponent implements OnInit {

  queues: QueueModel[] = [];

  constructor(private queueService: QueueService) {}

  ngOnInit() {
    this.loadQueues();
  }

  loadQueues() {
    this.queueService.getQueues().subscribe(q => this.queues = q);
  }

  addQueue() {
    this.queueService.createQueue(200, 150)
      .subscribe(queue => this.queues.push(queue));
  }

  onMoved(queue: QueueModel, pos: { x: number; y: number }) {
    this.queueService.updatePosition(queue.id, pos.x, pos.y).subscribe();
  }
}
