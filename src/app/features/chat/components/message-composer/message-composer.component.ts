import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatStoreService } from '../../../../core/services/chat-store.service';
import { KnowledgeStoreService } from '../../../../core/services/knowledge-store.service';
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
  readonly knowledge = inject(KnowledgeStoreService);
  readonly store = this.chatStore;
  readonly draft = this.chatStore.composerDraft;

  updateDraft(value: string): void {
    this.chatStore.updateComposerDraft(value);
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
  }

  setScope(value: string): void {
    if (value === 'none') {
      this.chatStore.setSourceScope({ kind: 'none' });
    } else if (value === 'all') {
      this.chatStore.setSourceScope({ kind: 'all' });
    } else {
      this.chatStore.setSourceScope({ kind: 'collection', collection: value });
    }
  }

  stop(): void {
    this.chatStore.stopGeneration();
  }
}
