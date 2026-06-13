import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { KnowledgeFile } from '../../../../core/models/knowledge-file.model';
import { KnowledgeStoreService } from '../../../../core/services/knowledge-store.service';
import { ActivityFeedComponent } from '../../components/activity-feed/activity-feed.component';
import { CollectionCardComponent, KnowledgeCollection } from '../../components/collection-card/collection-card.component';
import { FileCardComponent } from '../../components/file-card/file-card.component';
import { KnowledgeMetricsComponent } from '../../components/knowledge-metrics/knowledge-metrics.component';

const COLLECTIONS: Array<Omit<KnowledgeCollection, 'fileCount' | 'indexedCount'>> = [
  { name: 'Product Docs', description: 'Requirements, release notes, specs, and customer-facing source material.' },
  { name: 'Engineering', description: 'Architecture references, implementation notes, APIs, and technical docs.' },
  { name: 'Research', description: 'Market analysis, papers, benchmarks, and discovery documents.' },
  { name: 'Personal Notes', description: 'Private working notes, drafts, reminders, and personal context.' },
  { name: 'Meeting Notes', description: 'Decisions, transcripts, standups, and stakeholder conversations.' },
];

@Component({
  selector: 'app-knowledge-base-page',
  imports: [
    CommonModule,
    ActivityFeedComponent,
    CollectionCardComponent,
    FileCardComponent,
    KnowledgeMetricsComponent,
  ],
  templateUrl: './knowledge-base-page.component.html',
  styleUrl: './knowledge-base-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBasePageComponent {
  readonly knowledgeStore = inject(KnowledgeStoreService);
  readonly dragging = signal(false);
  readonly collections = computed<KnowledgeCollection[]>(() => COLLECTIONS.map((collection) => {
    const files = this.knowledgeStore.files().filter((file) => this.collectionForFile(file) === collection.name);
    return {
      ...collection,
      fileCount: files.length,
      indexedCount: files.filter((file) => file.status === 'Indexed').length,
    };
  }));

  readonly activeCollectionCount = computed(() => this.collections().filter((collection) => collection.fileCount > 0).length);

  readonly collectionForFile = (file: KnowledgeFile): string => {
    return file.collection;
  };

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
      void this.knowledgeStore.addFiles(files);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      void this.knowledgeStore.addFiles(input.files);
      input.value = '';
    }
  }

  updateCollection(fileId: string, collection: string): void {
    this.knowledgeStore.updateCollection(fileId, collection);
  }
}
