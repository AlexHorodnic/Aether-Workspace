import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { KnowledgeFile } from '../../../../core/models/knowledge-file.model';

@Component({
  selector: 'app-knowledge-file-card',
  templateUrl: './file-card.component.html',
  styleUrl: './file-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileCardComponent {
  readonly file = input.required<KnowledgeFile>();
  readonly collection = input.required<string>();
  readonly collections = input.required<readonly string[]>();
  readonly remove = output<string>();
  readonly collectionChange = output<string>();

  formatSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  formatDate(timestamp: number): string {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(timestamp);
  }
}
