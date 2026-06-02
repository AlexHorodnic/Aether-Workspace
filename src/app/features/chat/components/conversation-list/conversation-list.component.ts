import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ChatStoreService } from '../../../../core/services/chat-store.service';

@Component({
  selector: 'app-conversation-list',
  imports: [CommonModule],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent {
  readonly chatStore = inject(ChatStoreService);

  createConversation(): void {
    this.chatStore.createConversation();
  }

  selectConversation(id: string): void {
    this.chatStore.selectConversation(id);
  }

  renameConversation(id: string, currentTitle: string, event: MouseEvent): void {
    event.stopPropagation();
    const nextTitle = window.prompt('Rename conversation', currentTitle);
    if (nextTitle !== null) {
      this.chatStore.renameConversation(id, nextTitle);
    }
  }

  deleteConversation(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      this.chatStore.deleteConversation(id);
    }
  }
}
