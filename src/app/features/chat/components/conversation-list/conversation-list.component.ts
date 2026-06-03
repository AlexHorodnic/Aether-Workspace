import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, inject, signal } from '@angular/core';
import { Conversation } from '../../../../core/models/chat.models';
import { ChatStoreService } from '../../../../core/services/chat-store.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TextDialogComponent } from '../../../../shared/components/text-dialog/text-dialog.component';

@Component({
  selector: 'app-conversation-list',
  imports: [CommonModule, ConfirmDialogComponent, TextDialogComponent],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent {
  readonly chatStore = inject(ChatStoreService);
  readonly pendingDelete = signal<Conversation | null>(null);
  readonly pendingRename = signal<Conversation | null>(null);
  readonly showHeader = input(true);
  readonly conversationActivated = output<void>();

  createConversation(): void {
    this.chatStore.createConversation();
    this.conversationActivated.emit();
  }

  selectConversation(id: string): void {
    this.chatStore.selectConversation(id);
    this.conversationActivated.emit();
  }

  renameConversation(id: string, currentTitle: string, event: MouseEvent): void {
    event.stopPropagation();
    const conversation = this.chatStore.conversations().find((item) => item.id === id);
    if (conversation) {
      this.pendingRename.set(conversation);
    }
  }

  deleteConversation(id: string, event: MouseEvent): void {
    event.stopPropagation();
    const conversation = this.chatStore.conversations().find((item) => item.id === id);
    if (!conversation) {
      return;
    }

    if (conversation.messages.length === 0) {
      this.chatStore.deleteConversation(id);
      return;
    }

    this.pendingDelete.set(conversation);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const conversation = this.pendingDelete();
    if (!conversation) {
      return;
    }

    this.chatStore.deleteConversation(conversation.id);
    this.pendingDelete.set(null);
  }

  cancelRename(): void {
    this.pendingRename.set(null);
  }

  confirmRename(title: string): void {
    const conversation = this.pendingRename();
    if (!conversation) {
      return;
    }

    this.chatStore.renameConversation(conversation.id, title);
    this.pendingRename.set(null);
  }

  preview(conversation: Conversation): string {
    const lastMessage = conversation.messages.at(-1);
    if (!lastMessage?.content.trim()) {
      return 'Ready for your first message.';
    }

    return lastMessage.content.replace(/\s+/g, ' ').trim();
  }

  timestamp(value: number): string {
    const date = new Date(value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
    }

    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  }
}
