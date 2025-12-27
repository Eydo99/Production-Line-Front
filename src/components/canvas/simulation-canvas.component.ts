import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';  // ← IMPORT THIS
import { Subscription } from 'rxjs';
import { QueueService, QueueModel } from '../../services/queue.service';
import { MachineService, MachineModel } from '../../services/machine.service';
import { ConnectionService, ConnectionModel } from '../../services/connection.service';
import { SimulationService } from '../../services/SimulationService';
import { WebSocketService } from '../../services/websocket.service';
import { QueueNodeComponent } from './queue-node/queue-node.component';
import { MachineNodeComponent } from './machine-node/machine-node.component';
import { ConnectionLineComponent } from './connection-line/connection-line.component';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';
import { PlaybackControlsComponent } from '../playback-controls/playback-controls.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-simulation-canvas',
  standalone: true,
  imports: [
    CommonModule,
    QueueNodeComponent,
    MachineNodeComponent,
    ConnectionLineComponent,
    ZoomControlsComponent,
    PlaybackControlsComponent,
    FormsModule
  ],
  templateUrl: './simulation-canvas.component.html',
  styleUrls: ['./simulation-canvas.component.css']
})
export class SimulationCanvasComponent implements OnInit, OnDestroy {

  queues: QueueModel[] = [];
  machines: MachineModel[] = [];
  connections: ConnectionModel[] = [];
  isRunning = false;  // ← YOU ALREADY HAVE THIS

  // Connection creation state
  connectingMode = false;

  selectedNode: { id: string; type: 'queue' | 'machine' } | null = null;
  selectedNodeDetails: {
    type: 'queue' | 'machine';
    data: QueueModel | MachineModel;
  } | null = null;

  newCapacity: number = 10;
  newServiceTime: number = 2;

  // Zoom & Pan state
  scale = 1;
  panX = 0;
  panY = 0;
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;

  private queueUpdateSub?: Subscription;
  private machineUpdateSub?: Subscription;

  // ← FIX YOUR CONSTRUCTOR HERE
  constructor(
    private queueService: QueueService,
    private machineService: MachineService,
    private connectionService: ConnectionService,
    private wsService: WebSocketService,
    private http: HttpClient,
    private simulationService: SimulationService// ← ADD THIS LINE!
  ) { }

  ngOnInit() {
    this.loadQueues();
    this.loadMachines();
    this.loadConnections();
    this.subscribeToUpdates();
    // ← ADD THIS:
    this.simulationService.isRunning$.subscribe(running => {
      this.isRunning = running;
    });
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
    this.machineService.updatePosition(machine.name, pos.x, pos.y).subscribe();
    this.updateConnectionPositions();
  }

  // ========== CONNECTION SYSTEM ==========
  toggleConnectionMode() {
    this.connectingMode = !this.connectingMode;
    this.selectedNode = null;
    console.log('🔗 Connection mode:', this.connectingMode);
  }

  selectNodeForConnection(id: string, type: 'queue' | 'machine') {
    // Show properties panel whenever a node is clicked
    this.selectNodeForProperties(id, type);
    if (!this.connectingMode) return;

    if (!this.selectedNode) {
      this.selectedNode = { id, type };
      console.log('✅ Selected first node:', this.selectedNode);
    } else {
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
  // ========== REAL-TIME UPDATES ==========
  private subscribeToUpdates() {
    // Queue updates
    this.queueUpdateSub = this.wsService.queueUpdates$.subscribe(update => {
      const queue = this.queues.find(q => q.id === update.queueId);
      if (queue) {
        queue.size = update.currentSize;
        console.log(`📦 Queue Update: ${queue.id} size = ${queue.size}`);

        // Update properties panel if this queue is selected
        if (this.selectedNodeDetails?.type === 'queue' &&
          (this.selectedNodeDetails.data as QueueModel).id === update.queueId) {
          (this.selectedNodeDetails.data as QueueModel).size = update.currentSize;
        }
      }
    });

    // Machine updates
    this.machineUpdateSub = this.wsService.machineUpdates$.subscribe(update => {
      // ✅ FIX: Search by machine.name (not machine.id)
      const machine = this.machines.find(m => m.name === update.machineId);

      if (machine) {
        // Update status
        machine.status = update.status as any;

        // Update color and ready state based on status
        if (update.status === 'processing') {
          machine.color = update.productColor;
          machine.ready = false;
        } else if (update.status === 'FLASHING') {
          machine.color = update.productColor;
          machine.ready = false;

          // Optional: Add visual flash effect
          setTimeout(() => {
            if (machine.status === 'FLASHING') {
              machine.status = 'idle';
            }
          }, 200);
        } else if (update.status === 'idle') {
          machine.color = machine.defaultColor;
          machine.ready = true;
        }

        console.log(`⚙️ Machine Update: ${machine.name} - Status: ${machine.status}, Color: ${machine.color}, Ready: ${machine.ready}`);

        // Update properties panel if this machine is selected
        if (this.selectedNodeDetails?.type === 'machine' &&
          (this.selectedNodeDetails.data as MachineModel).name === update.machineId) {
          const selectedMachine = this.selectedNodeDetails.data as MachineModel;
          selectedMachine.status = machine.status;
          selectedMachine.color = machine.color;
          selectedMachine.ready = machine.ready;
        }
      }
    });
  }

  /**
   * Select node for properties panel
   */
  selectNodeForProperties(id: string, type: 'queue' | 'machine') {
    if (type === 'queue') {
      const queue = this.queues.find(q => q.id === id);
      if (queue) {
        this.selectedNodeDetails = { type: 'queue', data: queue };
      }
    } else {
      const machine = this.machines.find(m => m.name === id);
      if (machine) {
        this.selectedNodeDetails = { type: 'machine', data: machine };
      }
    }
  }

  clearSelection() {
    this.selectedNodeDetails = null;
  }

  // updateQueueCapacity() {
  //   if (this.selectedNodeDetails?.type !== 'queue') return;

  //   const queue = this.selectedNodeDetails.data as QueueModel;

  //   this.queueService.updateCapacity(queue.id, this.newCapacity).subscribe({
  //     next: (updatedQueue) => {
  //       queue.capacity = updatedQueue.capacity;
  //       console.log('✅ Queue capacity updated:', queue.id);
  //     },
  //     error: (err) => {
  //       console.error('❌ Failed to update capacity:', err);
  //       alert('Failed to update capacity');
  //     }
  //   });
  // }

  updateMachineServiceTime() {
    if (this.selectedNodeDetails?.type !== 'machine') return;

    const machine = this.selectedNodeDetails.data as MachineModel;
    const timeInMs = this.newServiceTime * 1000;

    this.machineService.updateServiceTime(machine.name, timeInMs).subscribe({
      next: (updatedMachine) => {
        machine.serviceTime = updatedMachine.serviceTime;
        console.log('✅ Machine service time updated:', machine.name);
      },
      error: (err) => {
        console.error('❌ Failed to update service time:', err);
        alert('Failed to update service time');
      }
    });
  }

  deleteSelectedNode() {
    if (!this.selectedNodeDetails) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete this ${this.selectedNodeDetails.type}?`
    );

    if (!confirmDelete) return;

    if (this.selectedNodeDetails.type === 'queue') {
      const queue = this.selectedNodeDetails.data as QueueModel;

      this.queueService.deleteQueue(queue.id).subscribe({
        next: () => {
          this.queues = this.queues.filter(q => q.id !== queue.id);
          this.clearSelection();
          console.log('🗑️ Queue deleted:', queue.id);
        },
        error: (err) => {
          console.error('❌ Failed to delete queue:', err);
          alert('Failed to delete queue');
        }
      });
    } else {
      const machine = this.selectedNodeDetails.data as MachineModel;

      this.machineService.deleteMachine(machine.name).subscribe({
        next: () => {
          this.machines = this.machines.filter(m => m.name !== machine.name);
          this.clearSelection();
          console.log('🗑️ Machine deleted:', machine.name);
        },
        error: (err) => {
          console.error('❌ Failed to delete machine:', err);
          alert('Failed to delete machine');
        }
      });
    }
  }
}
