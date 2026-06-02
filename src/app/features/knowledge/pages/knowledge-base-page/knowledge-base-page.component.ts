import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { KnowledgeStoreService } from '../../../../core/services/knowledge-store.service';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-knowledge-base-page',
  imports: [CommonModule, CardComponent, EmptyStateComponent],
  templateUrl: './knowledge-base-page.component.html',
  styleUrl: './knowledge-base-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBasePageComponent {
  readonly knowledgeStore = inject(KnowledgeStoreService);
  readonly dragging = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.knowledgeStore.addFiles(files);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.knowledgeStore.addFiles(input.files);
      input.value = '';
    }
  }

  formatSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
}
