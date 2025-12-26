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
    // Use machine.ready to determine status color
    if (!this.machine.ready) {
      return 'bg-blue-500'; // Processing
    }
    return 'bg-green-500'; // Idle/Ready
  }

  getStatusText(): string {
    return this.machine.status || 'idle';
  }

  /**
   * Get background color based on machine state
   * Reflects the product color when processing
   */
  getMachineColor(): string {
    return this.machine.color || this.machine.defaultColor || '#3b82f6';
  }

  /**
   * Check if machine is currently processing
   */
  isProcessing(): boolean {
    return !this.machine.ready || this.machine.status === 'processing';
  }

  /**
   * Get service time in seconds for display
   */
  getServiceTimeSeconds(): number {
    return this.machine.serviceTime / 1000;
  }
}