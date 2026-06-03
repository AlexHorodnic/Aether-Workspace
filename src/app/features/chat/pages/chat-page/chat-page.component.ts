import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { LucideMessageSquare, LucideX } from '@lucide/angular';
import { ChatStoreService } from '../../../../core/services/chat-store.service';
import { ConversationListComponent } from '../../components/conversation-list/conversation-list.component';
import { MessageComposerComponent } from '../../components/message-composer/message-composer.component';
import { MessageListComponent } from '../../components/message-list/message-list.component';

@Component({
  selector: 'app-chat-page',
  imports: [ConversationListComponent, MessageListComponent, MessageComposerComponent, LucideMessageSquare, LucideX],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent {
  readonly chatStore = inject(ChatStoreService);
  readonly conversationsOpen = signal(false);

  openConversations(): void {
    this.conversationsOpen.set(true);
  }

  closeConversations(): void {
    this.conversationsOpen.set(false);
  }

  createConversationFromSheet(): void {
    this.chatStore.createConversation();
    this.closeConversations();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.closeConversations();
  }
}
