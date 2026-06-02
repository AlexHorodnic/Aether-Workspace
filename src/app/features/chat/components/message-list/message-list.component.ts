import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Conversation } from '../../../../core/models/chat.models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-message-list',
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent {
  readonly conversation = input<Conversation | null>(null);
}
