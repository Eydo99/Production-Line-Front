import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { QueueService, QueueModel } from '../../services/queue.service';
import { MachineService, MachineModel } from '../../services/machine.service';
import { ConnectionService, ConnectionModel } from '../../services/connection.service';
import { WebSocketService } from '../../services/websocket.service';
import { QueueNodeComponent } from './queue-node/queue-node.component';
import { MachineNodeComponent } from './machine-node/machine-node.component';
import { ConnectionLineComponent } from './connection-line/connection-line.component';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';

@Component({
  selector: 'app-simulation-canvas',
  standalone: true,
  imports: [
    CommonModule, 
    QueueNodeComponent, 
    MachineNodeComponent,
    ConnectionLineComponent,
    ZoomControlsComponent
  ],
  templateUrl: './simulation-canvas.component.html',
  styleUrls: ['./simulation-canvas.component.css']
})
export class SimulationCanvasComponent implements OnInit, OnDestroy {

  queues: QueueModel[] = [];
  machines: MachineModel[] = [];
  connections: ConnectionModel[] = [];
  
  // Connection creation state
  connectingMode = false;
  selectedNode: { id: string; type: 'queue' | 'machine' } | null = null;
  
  // Zoom & Pan state
  scale = 1;
  panX = 0;
  panY = 0;
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;

  private queueUpdateSub?: Subscription;
  private machineUpdateSub?: Subscription;

  constructor(
    private queueService: QueueService,
    private machineService: MachineService,
    private connectionService: ConnectionService,
    private wsService: WebSocketService
  ) {}

  ngOnInit() {
    this.loadQueues();
    this.loadMachines();
    this.loadConnections();
    this.subscribeToUpdates();
  }

  ngOnDestroy() {
    this.queueUpdateSub?.unsubscribe();
    this.machineUpdateSub?.unsubscribe();
  }

  // ========== LOAD DATA ==========
  loadQueues() {
    this.queueService.getQueues().subscribe(q => {
      console.log('📋 Loaded queues:', q);
      this.queues = q;
      this.updateConnectionPositions();
    });
  }

  loadMachines() {
    this.machineService.getMachines().subscribe(m => {
      console.log('⚙️ Loaded machines:', m);
      this.machines = m;
      this.updateConnectionPositions();
    });
  }

  loadConnections() {
    this.connectionService.getConnections().subscribe(c => {
      console.log('🔗 Loaded connections:', c);
      this.connections = c;
      this.updateConnectionPositions();
    });
  }

  // ========== ADD NODES ==========
  addQueue() {
    const randomX = Math.floor(Math.random() * 400) + 100;
    const randomY = Math.floor(Math.random() * 300) + 100;
    
    this.queueService.createQueue(randomX, randomY).subscribe(queue => {
      console.log('➕ Queue created:', queue);
      this.queues.push(queue);
    });
  }

  addMachine() {
    const randomX = Math.floor(Math.random() * 400) + 300;
    const randomY = Math.floor(Math.random() * 300) + 100;
    
    this.machineService.createMachine(randomX, randomY).subscribe(machine => {
      console.log('➕ Machine created:', machine);
      this.machines.push(machine);
    });
  }

  // ========== NODE MOVEMENT ==========
  onQueueMoved(queue: QueueModel, pos: { x: number; y: number }) {
    queue.x = pos.x;
    queue.y = pos.y;
    this.queueService.updatePosition(queue.id, pos.x, pos.y).subscribe();
    this.updateConnectionPositions();
  }

  onMachineMoved(machine: MachineModel, pos: { x: number; y: number }) {
    machine.x = pos.x;
    machine.y = pos.y;
    this.machineService.updatePosition(machine.id, pos.x, pos.y).subscribe();
    this.updateConnectionPositions();
  }

  // ========== CONNECTION SYSTEM ==========
  toggleConnectionMode() {
    this.connectingMode = !this.connectingMode;
    this.selectedNode = null;
    console.log('🔗 Connection mode:', this.connectingMode);
  }

  selectNodeForConnection(id: string, type: 'queue' | 'machine') {
    if (!this.connectingMode) return;

    if (!this.selectedNode) {
      // First node selected
      this.selectedNode = { id, type };
      console.log('✅ Selected first node:', this.selectedNode);
    } else {
      // Second node selected - create connection
      const fromId = this.selectedNode.id;
      const toId = id;

      if (this.connectionService.validateConnection(fromId, toId)) {
        this.connectionService.createConnection(fromId, toId).subscribe(
          conn => {
            console.log('✅ Connection created:', conn);
            this.connections.push(conn);
            this.updateConnectionPositions();
            this.selectedNode = null;
            this.connectingMode = false;
          },
          error => {
            console.error('❌ Connection failed:', error);
            alert('Failed to create connection: ' + (error.error?.message || 'Unknown error'));
          }
        );
      } else {
        alert('Invalid connection! Must follow Q→M→Q pattern.');
        this.selectedNode = null;
      }
    }
  }

  updateConnectionPositions() {
    this.connections.forEach(conn => {
      const fromNode = this.getNodeById(conn.fromId);
      const toNode = this.getNodeById(conn.toId);
      
      if (fromNode && toNode) {
        conn.fromX = fromNode.x;
        conn.fromY = fromNode.y;
        conn.toX = toNode.x;
        conn.toY = toNode.y;
      }
    });
  }

  private getNodeById(id: string): { x: number; y: number } | null {
    const queue = this.queues.find(q => q.id === id);
    if (queue) return queue;
    
    const machine = this.machines.find(m => m.id === id);
    if (machine) return machine;
    
    return null;
  }

  // ========== ZOOM & PAN ==========
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(2, this.scale + delta));
    
    this.scale = newScale;
  }

  @HostListener('mousedown', ['$event'])
  onCanvasMouseDown(event: MouseEvent) {
    // Start panning only if clicking on canvas background (not on nodes)
    if ((event.target as HTMLElement).classList.contains('canvas-background')) {
      this.isPanning = true;
      this.lastPanX = event.clientX;
      this.lastPanY = event.clientY;
    }
  }

  @HostListener('mousemove', ['$event'])
  onCanvasMouseMove(event: MouseEvent) {
    if (!this.isPanning) return;
    
    const dx = event.clientX - this.lastPanX;
    const dy = event.clientY - this.lastPanY;
    
    this.panX += dx;
    this.panY += dy;
    
    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;
  }

  @HostListener('mouseup')
  onCanvasMouseUp() {
    this.isPanning = false;
  }

  handleZoomIn() {
    this.scale = Math.min(2, this.scale + 0.1);
  }

  handleZoomOut() {
    this.scale = Math.max(0.5, this.scale - 0.1);
  }

  handleResetZoom() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
  }

  getCanvasTransform(): string {
    return `scale(${this.scale}) translate(${this.panX}px, ${this.panY}px)`;
  }

  // ========== REAL-TIME UPDATES ==========
  private subscribeToUpdates() {
    // Queue updates
    this.queueUpdateSub = this.wsService.queueUpdates$.subscribe(update => {
      const queue = this.queues.find(q => q.id === update.queueId);
      if (queue) {
        queue.size = update.currentSize;
        console.log(`📦 Updated ${queue.id} size: ${queue.size}`);
      }
    });

    // Machine updates
    this.machineUpdateSub = this.wsService.machineUpdates$.subscribe(update => {
      const machine = this.machines.find(m => m.id === update.machineId);
      if (machine) {
        machine.status = update.status as any;
        console.log(`⚙️ Updated ${machine.id} status: ${machine.status}`);
      }
    });
  }
}