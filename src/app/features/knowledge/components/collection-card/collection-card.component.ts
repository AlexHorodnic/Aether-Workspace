import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface KnowledgeCollection {
  name: string;
  description: string;
  fileCount: number;
  indexedCount: number;
}

@Component({
  selector: 'app-collection-card',
  templateUrl: './collection-card.component.html',
  styleUrl: './collection-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionCardComponent {
  readonly collection = input.required<KnowledgeCollection>();
  readonly active = input(false);
  readonly selected = output<string>();
}
