import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) open = false;
  @Input() title = 'Confirm action';
  @Input() description = 'This action cannot be undone.';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmLabel = 'Confirm';

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  private readonly document = inject(DOCUMENT);
  private previousOverflow: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) {
      return;
    }

    if (this.open) {
      this.lockScroll();
      window.setTimeout(() => this.dialog?.nativeElement.focus(), 0);
      return;
    }

    this.unlockScroll();
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.cancel.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  private lockScroll(): void {
    if (this.previousOverflow === null) {
      this.previousOverflow = this.document.body.style.overflow;
    }

    this.document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    if (this.previousOverflow === null) {
      return;
    }

    this.document.body.style.overflow = this.previousOverflow;
    this.previousOverflow = null;
  }
}
