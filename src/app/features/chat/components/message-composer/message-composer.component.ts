import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatStoreService } from '../../../../core/services/chat-store.service';
import { LocalAiService } from '../../../../core/services/local-ai.service';

@Component({
  selector: 'app-message-composer',
  imports: [FormsModule],
  templateUrl: './message-composer.component.html',
  styleUrl: './message-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComposerComponent {
  private readonly chatStore = inject(ChatStoreService);
  readonly localAi = inject(LocalAiService);
  readonly store = this.chatStore;

  readonly draft = signal('');

  updateDraft(value: string): void {
    this.draft.set(value);
    this.chatStore.clearComposerError();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.send();
  }

  send(): void {
    const message = this.draft().trim();
    if (!message) {
      return;
    }

    void this.chatStore.sendMessage(message);
    this.draft.set('');
  }
}
