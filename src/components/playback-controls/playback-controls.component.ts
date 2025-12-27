import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from '../../services/SimulationService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-playback-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'playback-controls.component.html',
  styleUrl:'playback-controls.component.css'
})
export class PlaybackControlsComponent implements OnInit, OnDestroy {

  isRunning = false;
  isPaused = false;
  statistics = {
    totalGenerated: 0,
    totalProcessed: 0,
    duration: 0,
    avgQueueLength: 0
  };

  private subscriptions: Subscription[] = [];

  constructor(private simulationService: SimulationService) {}

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
      this.simulationService.statistics$.subscribe(stats => {
        this.statistics = stats;
      })
    );

    // Poll statistics every 1 second when running
    setInterval(() => {
      if (this.isRunning) {
        this.simulationService.getStatistics().subscribe();
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
      },
      error: (err) => {
        alert('Failed to stop simulation: ' + (err.error?.error || 'Unknown error'));
        console.error('❌ Stop error:', err);
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
