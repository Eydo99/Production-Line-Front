import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../services/SimulationService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-playback-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'playback-controls.component.html',
  styleUrl: 'playback-controls.component.css'
})
export class PlaybackControlsComponent implements OnInit, OnDestroy {

  isRunning = false;
  isPaused = false;
  isReplaying = false;
  hasSnapshot = false;
  statistics = {
    totalGenerated: 0,
    totalProcessed: 0,
    duration: 0,
    avgQueueLength: 0
  };

  private subscriptions: Subscription[] = [];
  private statusCheckInterval: any;

  constructor(private simulationService: SimulationService) { }

  ngOnInit() {
    // Subscribe to simulation state
    this.subscriptions.push(
      this.simulationService.isRunning$.subscribe(running => {
        this.isRunning = running;
        console.log('🎮 Playback controls - isRunning:', running);
      })
    );

    this.subscriptions.push(
      this.simulationService.isPaused$.subscribe(paused => {
        this.isPaused = paused;
        console.log('🎮 Playback controls - isPaused:', paused);
      })
    );

    this.subscriptions.push(
      this.simulationService.isReplaying$.subscribe(replaying => {
        this.isReplaying = replaying;
        console.log('🎮 Playback controls - isReplaying:', replaying);
      })
    );

    this.subscriptions.push(
      this.simulationService.statistics$.subscribe(stats => {
        this.statistics = stats;
      })
    );

    // Check snapshot status immediately
    this.checkSnapshotStatus();

    // Poll statistics and snapshot availability every 2 seconds
    this.statusCheckInterval = setInterval(() => {
      // Check for snapshot availability
      this.checkSnapshotStatus();

      // Update statistics if running
      if (this.isRunning) {
        this.simulationService.getStatistics().subscribe();
      }
    }, 2000); // 2-second interval
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());

    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  }

  /**
   * Replay simulation from previous run
   */
  onReplay() {
    if (this.isRunning) {
      alert('Cannot replay while simulation is running. Stop it first.');
      return;
    }

    if (!this.hasSnapshot) {
      alert('No snapshot available. Run a simulation first.');
      return;
    }

    console.log('🔁 Starting replay...');

    this.simulationService.replaySimulation().subscribe({
      next: (res) => {
        console.log('✅ Replay started:', res);
        // Show success message with details
        const message = `Replay started!\n` +
          `Duration: ${res.durationSeconds || 0}s\n` +
          `Products: ${res.productsToReplay || 0}`;
        console.log(message);
      },
      error: (err) => {
        const errorMsg = err.error?.error || err.error?.message || 'Unknown error';
        alert('Failed to replay: ' + errorMsg);
        console.error('❌ Replay error:', err);
      }
    });
  }

  /**
   * Start or resume simulation
   */
  onStart() {
    if (this.isPaused) {
      // Resume
      this.simulationService.resumeSimulation().subscribe({
        next: () => {
          console.log('▶️  Simulation resumed');
        },
        error: (err) => {
          alert('Failed to resume simulation: ' + (err.error?.error || 'Unknown error'));
          console.error('❌ Resume error:', err);
        }
      });
    } else {
      // Start
      this.simulationService.startSimulation().subscribe({
        next: () => {
          console.log('▶️  Simulation started');
        },
        error: (err) => {
          alert('Failed to start simulation: ' + (err.error?.error || 'Unknown error'));
          console.error('❌ Start error:', err);
        }
      });
    }
  }

  /**
   * Pause simulation
   */
  onPause() {
    this.simulationService.pauseSimulation().subscribe({
      next: () => {
        console.log('⏸️  Simulation paused');
      },
      error: (err) => {
        alert('Failed to pause simulation: ' + (err.error?.error || 'Unknown error'));
        console.error('❌ Pause error:', err);
      }
    });
  }

  /**
   * Stop simulation
   */
  onStop() {
    if (!confirm('Are you sure you want to stop the simulation?')) {
      return;
    }

    this.simulationService.stopSimulation().subscribe({
      next: () => {
        console.log('⏹️  Simulation stopped');
        // Check snapshot status immediately after stopping
        setTimeout(() => {
          this.checkSnapshotStatus();
        }, 500);
      },
      error: (err) => {
        alert('Failed to stop simulation: ' + (err.error?.error || 'Unknown error'));
        console.error('❌ Stop error:', err);
      }
    });
  }

  /**
   * Check if a snapshot exists for replay
   */
  private checkSnapshotStatus() {
    this.simulationService.checkSnapshot().subscribe({
      next: (hasSnapshot) => {
        this.hasSnapshot = hasSnapshot;
        console.log('📸 Snapshot available:', hasSnapshot);
      },
      error: (err) => {
        console.error('❌ Error checking snapshot:', err);
        this.hasSnapshot = false;
      }
    });
  }

  /**
   * Clear simulation
   */
  onClear() {
    if (!confirm('This will clear all queues, machines, and connections. Are you sure?')) {
      return;
    }

    this.simulationService.clearSimulation().subscribe({
      next: () => {
        console.log('🧹 Simulation cleared');
        window.location.reload(); // Reload to reset UI
      },
      error: (err) => {
        alert('Failed to clear simulation: ' + (err.error?.error || 'Unknown error'));
        console.error('❌ Clear error:', err);
      }
    });
  }

  /**
   * Get status text for display
   */
  getStatusText(): string {
    if (this.isReplaying) return 'Replaying';
    if (this.isPaused) return 'Paused';
    if (this.isRunning) return 'Running';
    return 'Stopped';
  }

  /**
   * Format duration from milliseconds to MM:SS
   */
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
