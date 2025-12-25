import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionModel } from '../../../services/connection.service';

@Component({
  selector: 'app-connection-line',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg 
      class="absolute inset-0 w-full h-full pointer-events-none" 
      style="z-index: 1;">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto">
          <polygon 
            points="0 0, 10 3, 0 6" 
            fill="#64748b" />
        </marker>
      </defs>
      
      <g *ngFor="let conn of connections">
        <!-- Connection Path -->
        <path
          [attr.d]="getPath(conn)"
          stroke="#64748b"
          stroke-width="2"
          fill="none"
          marker-end="url(#arrowhead)"
          class="transition-all duration-200" />
        
        <!-- Animated Product Dot (if exists) -->
        <circle
          *ngIf="conn.animating"
          [attr.cx]="conn.animX"
          [attr.cy]="conn.animY"
          r="6"
          [attr.fill]="conn.productColor || '#3b82f6'"
          class="drop-shadow-md">
          <animate
            attributeName="r"
            values="6;8;6"
            dur="1s"
            repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  `,
  styles: []
})
export class ConnectionLineComponent {
  @Input() connections: ConnectionModel[] = [];

  getPath(conn: ConnectionModel): string {
    if (!conn.fromX || !conn.fromY || !conn.toX || !conn.toY) {
      return '';
    }

    const startX = conn.fromX + 144; // Queue width + connector offset
    const startY = conn.fromY + 64;  // Half height
    const endX = conn.toX - 6;       // Machine connector offset
    const endY = conn.toY + 64;

    // Curved path for better visuals
    const midX = (startX + endX) / 2;
    
    return `M ${startX} ${startY} 
            Q ${midX} ${startY}, ${midX} ${(startY + endY) / 2}
            T ${endX} ${endY}`;
  }
}