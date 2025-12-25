import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output
} from '@angular/core';

@Directive({
  selector: '[appDraggable]',
  standalone: true
})
export class DraggableDirective {

  @Output() dragEnd = new EventEmitter<{ x: number; y: number }>();

  private dragging = false;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;

  constructor(private el: ElementRef<HTMLElement>) {
    this.el.nativeElement.style.position = 'absolute';
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    event.preventDefault();

    this.dragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.initialLeft = rect.left;
    this.initialTop = rect.top;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.dragging) return;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    this.el.nativeElement.style.left = this.initialLeft + dx + 'px';
    this.el.nativeElement.style.top = this.initialTop + dy + 'px';
  };

  onMouseUp = () => {
    if (!this.dragging) return;

    this.dragging = false;

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);

    const left = this.el.nativeElement.offsetLeft;
    const top = this.el.nativeElement.offsetTop;

    // 🔴 THIS IS THE IMPORTANT PART
    this.dragEnd.emit({ x: left, y: top });
  };
}
