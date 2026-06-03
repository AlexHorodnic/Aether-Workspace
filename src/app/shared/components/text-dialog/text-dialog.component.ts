import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-dialog',
  imports: [FormsModule],
  templateUrl: './text-dialog.component.html',
  styleUrl: './text-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDialogComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) open = false;
  @Input() title = 'Update value';
  @Input() description = '';
  @Input() value = '';
  @Input() label = 'Value';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmLabel = 'Save';

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  @ViewChild('textInput') private textInput?: ElementRef<HTMLInputElement>;

  draft = '';

  private readonly document = inject(DOCUMENT);
  private previousOverflow: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.draft = this.value;
    }

    if (!changes['open']) {
      return;
    }

    if (this.open) {
      this.draft = this.value;
      this.lockScroll();
      window.setTimeout(() => {
        this.dialog?.nativeElement.focus();
        this.textInput?.nativeElement.select();
      }, 0);
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

  onSubmit(): void {
    const nextValue = this.draft.trim();
    if (!nextValue) {
      return;
    }

    this.confirm.emit(nextValue);
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
