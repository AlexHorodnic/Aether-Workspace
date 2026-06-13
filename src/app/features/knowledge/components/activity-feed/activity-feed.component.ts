import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { KnowledgeFile } from '../../../../core/models/knowledge-file.model';

export interface KnowledgeActivity {
  title: string;
  detail: string;
  tone: 'violet' | 'amber' | 'emerald';
}

@Component({
  selector: 'app-activity-feed',
  templateUrl: './activity-feed.component.html',
  styleUrl: './activity-feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent {
  readonly files = input.required<KnowledgeFile[]>();
  readonly collectionForFile = input.required<(file: KnowledgeFile) => string>();

  readonly activities = computed<KnowledgeActivity[]>(() => {
    const files = this.files();
    if (!files.length) {
      return [
        { title: 'Knowledge workspace initialized', detail: 'Upload PDFs, notes, or docs to build reusable AI context.', tone: 'violet' },
        { title: 'Collections ready', detail: 'Product Docs, Engineering, Research, Personal Notes, and Meeting Notes are available.', tone: 'amber' },
        { title: 'Local indexing enabled', detail: 'Extracted content is stored in private browser storage and used for cited answers.', tone: 'emerald' },
      ];
    }

    return files.slice(0, 5).map((file) => ({
      title: file.status === 'Indexed' ? `Indexed ${file.name}` : file.status === 'Failed' ? `Could not index ${file.name}` : `Processing ${file.name}`,
      detail: file.error ?? `Added to ${this.collectionForFile()(file)} collection`,
      tone: file.status === 'Indexed' ? 'emerald' : file.status === 'Processing' ? 'amber' : 'violet',
    }));
  });
}
