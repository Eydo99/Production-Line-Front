import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  OnDestroy,
  Input
} from '@angular/core';

@Directive({
  selector: '[appDraggable]',
  standalone: true
})
export class DraggableDirective implements OnDestroy {
  @Output() dragEnd = new EventEmitter<{ x: number; y: number }>();
  @Input() canvasScale = 1; // Compensate for zoom
  @Input() canvasPanX = 0;   // Compensate for pan X
  @Input() canvasPanY = 0;   // Compensate for pan Y

  private dragging = false;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;

  constructor(private el: ElementRef<HTMLElement>) {
    this.el.nativeElement.style.position = 'absolute';
    this.el.nativeElement.style.cursor = 'grab';
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // Prevent dragging if clicking on a button or other interactive element
    if ((event.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.dragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    // Get current position
    this.initialLeft = this.el.nativeElement.offsetLeft;
    this.initialTop = this.el.nativeElement.offsetTop;

    this.el.nativeElement.style.cursor = 'grabbing';
    this.el.nativeElement.style.userSelect = 'none';
    this.el.nativeElement.style.zIndex = '1000';

    // Add listeners to document so dragging works even if mouse leaves element
    document.addEventListener('mousemove', this.onMouseMove, { passive: false });
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.dragging) return;

    event.preventDefault();

    // Calculate mouse movement compensating for scale
    const dx = (event.clientX - this.startX) / this.canvasScale;
    const dy = (event.clientY - this.startY) / this.canvasScale;

    const newLeft = this.initialLeft + dx;
    const newTop = this.initialTop + dy;

    // Apply new position
    this.el.nativeElement.style.left = newLeft + 'px';
    this.el.nativeElement.style.top = newTop + 'px';
  };

  onMouseUp = () => {
    if (!this.dragging) return;

    this.dragging = false;
    this.el.nativeElement.style.cursor = 'grab';
    this.el.nativeElement.style.userSelect = '';
    this.el.nativeElement.style.zIndex = '';

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);

    const left = this.el.nativeElement.offsetLeft;
    const top = this.el.nativeElement.offsetTop;

    this.dragEnd.emit({ x: left, y: top });
  };

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
}