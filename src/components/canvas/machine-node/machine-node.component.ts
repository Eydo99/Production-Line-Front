import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachineModel } from '../../../services/machine.service';
import { DraggableDirective } from '../../../directives/draggable.directive';
import { SelectableDirective } from '../../../directives/selectable.directive';
@Component({
  selector: 'app-machine-node',
  standalone: true,
  imports: [
    CommonModule,
    DraggableDirective,
    SelectableDirective
  ],
  templateUrl: './machine-node.component.html',
  styleUrls: ['./machine-node.component.css']
})
export class MachineNodeComponent {

  @Input() machine!: MachineModel;
  @Output() moved = new EventEmitter<{ x: number; y: number }>();

  onDragEnd(pos: { x: number; y: number }) {
    this.moved.emit(pos);
  }

  getStatusColor(): string {
    switch (this.machine.status) {
      case 'idle': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }

  getStatusText(): string {
    return this.machine.status || 'Unknown';
  }
}