import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input } from '@angular/core';
import { Conversation } from '../../../../core/models/chat.models';
import { SettingsStoreService } from '../../../../core/services/settings-store.service';
import { AiAvatarComponent } from '../ai-avatar/ai-avatar.component';
import { ChatWelcomeComponent } from '../chat-welcome/chat-welcome.component';

@Component({
  selector: 'app-message-list',
  imports: [CommonModule, AiAvatarComponent, ChatWelcomeComponent],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent implements AfterViewChecked {
  private readonly settingsStore = inject(SettingsStoreService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastScrollSignature = '';
  private lastConversationId: string | null = null;
  private lastMessageCount = 0;
  private shouldStickToBottom = true;

  readonly conversation = input<Conversation | null>(null);
  readonly userInitials = computed(() => {
    const initials = this.settingsStore.settings().profileName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return initials || 'U';
  });

  ngAfterViewChecked(): void {
    const conversation = this.conversation();
    const signature = conversation?.messages
      .map((message) => `${message.id}:${message.content.length}:${message.status}`)
      .join('|') ?? '';

    if (!conversation || !signature || signature === this.lastScrollSignature) {
      return;
    }

    const conversationChanged = conversation.id !== this.lastConversationId;
    const messageAdded = conversation.messages.length > this.lastMessageCount;
    const shouldScroll = conversationChanged || messageAdded || this.shouldStickToBottom;

    this.lastScrollSignature = signature;
    this.lastConversationId = conversation.id;
    this.lastMessageCount = conversation.messages.length;

    if (!shouldScroll) {
      return;
    }

    this.scrollToBottom(messageAdded || conversationChanged ? 'smooth' : 'auto');
  }

  @HostListener('scroll')
  updateStickiness(): void {
    this.shouldStickToBottom = this.isNearBottom();
  }

  private scrollToBottom(behavior: ScrollBehavior): void {
    requestAnimationFrame(() => {
      const element = this.host.nativeElement;
      element.scrollTo({
        top: element.scrollHeight,
        behavior,
      });
      this.shouldStickToBottom = true;
    });
  }

  private isNearBottom(): boolean {
    const element = this.host.nativeElement;
    return element.scrollHeight - element.scrollTop - element.clientHeight < 96;
  }
}
