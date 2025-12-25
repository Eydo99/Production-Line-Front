import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueModel } from '../../../services/queue.service';
import { DraggableDirective } from '../../../directives/draggable.directive';
import { SelectableDirective } from '../../../directives/selectable.directive';

@Component({
  selector: 'app-queue-node',
  standalone: true,
  imports: [
    CommonModule,
    DraggableDirective,
    SelectableDirective
  ],
  templateUrl: './queue-node.component.html',
  styleUrls: ['./queue-node.component.css']
})
export class QueueNodeComponent {

  @Input() queue!: QueueModel;
  @Input() canvasScale = 1;  // Add scale input
  @Input() canvasPanX = 0;   // Add pan X input
  @Input() canvasPanY = 0;   // Add pan Y input

  @Output() moved = new EventEmitter<{ x: number; y: number }>();

  onDragEnd(pos: { x: number; y: number }) {
    this.moved.emit(pos);
  }
}