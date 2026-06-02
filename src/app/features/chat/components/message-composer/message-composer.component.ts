import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatStoreService } from '../../../../core/services/chat-store.service';

@Component({
  selector: 'app-message-composer',
  imports: [FormsModule],
  templateUrl: './message-composer.component.html',
  styleUrl: './message-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComposerComponent {
  private readonly chatStore = inject(ChatStoreService);

  readonly draft = signal('');

  updateDraft(value: string): void {
    this.draft.set(value);
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

    this.chatStore.sendMessage(message);
    this.draft.set('');
  }
}
