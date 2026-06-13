import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { KnowledgeFile } from '../../../../core/models/knowledge-file.model';

@Component({
  selector: 'app-knowledge-metrics',
  templateUrl: './knowledge-metrics.component.html',
  styleUrl: './knowledge-metrics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeMetricsComponent {
  readonly files = input.required<KnowledgeFile[]>();
  readonly collectionCount = input.required<number>();

  readonly indexedCount = computed(() => this.files().filter((file) => file.status === 'Indexed').length);
  readonly readyLabel = computed(() => this.indexedCount() ? `${this.indexedCount()} sources` : 'Add sources');
}
