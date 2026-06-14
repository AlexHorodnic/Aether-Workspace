import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    FormsModule,
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
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly dragging = signal(false);
  readonly search = signal('');
  readonly selectedCollection = signal<string | null>(null);
  readonly focusedFileId = signal<string | null>(null);
  readonly collections = computed<KnowledgeCollection[]>(() => COLLECTIONS.map((collection) => {
    const files = this.knowledgeStore.files().filter((file) => this.collectionForFile(file) === collection.name);
    return {
      ...collection,
      fileCount: files.length,
      indexedCount: files.filter((file) => file.status === 'Indexed').length,
    };
  }));

  readonly activeCollectionCount = computed(() => this.collections().filter((collection) => collection.fileCount > 0).length);
  readonly filteredFiles = computed(() => {
    const focusedFileId = this.focusedFileId();
    if (focusedFileId) {
      return this.knowledgeStore.files().filter((file) => file.id === focusedFileId);
    }

    const query = this.search().trim().toLowerCase();
    const collection = this.selectedCollection();
    return this.knowledgeStore.files().filter((file) => (
      (!collection || file.collection === collection)
      && (!query || `${file.name} ${file.type} ${file.collection} ${file.status}`.toLowerCase().includes(query))
    ));
  });

  readonly collectionForFile = (file: KnowledgeFile): string => {
    return file.collection;
  };

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const fileId = params.get('file');
      const file = this.knowledgeStore.files().find((item) => item.id === fileId);
      if (!file) {
        this.focusedFileId.set(null);
        return;
      }

      this.selectedCollection.set(null);
      this.search.set('');
      this.focusedFileId.set(file.id);
      window.setTimeout(() => this.focusFile(file.id), 0);
    });
  }

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

  selectCollection(collection: string): void {
    this.clearFocusedFile();
    this.selectedCollection.update((current) => current === collection ? null : collection);
  }

  setSearch(value: string): void {
    this.clearFocusedFile();
    this.search.set(value);
  }

  clearFilters(): void {
    this.search.set('');
    this.selectedCollection.set(null);
    this.clearFocusedFile();
  }

  private focusFile(fileId: string): void {
    const element = this.document.getElementById(`knowledge-file-${fileId}`);
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    element?.focus({ preventScroll: true });
  }

  private clearFocusedFile(): void {
    if (!this.focusedFileId()) return;
    this.focusedFileId.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { file: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
