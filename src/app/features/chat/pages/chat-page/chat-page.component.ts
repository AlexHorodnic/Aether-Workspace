import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ChatStoreService } from '../../../../core/services/chat-store.service';
import { ConversationListComponent } from '../../components/conversation-list/conversation-list.component';
import { MessageComposerComponent } from '../../components/message-composer/message-composer.component';
import { MessageListComponent } from '../../components/message-list/message-list.component';

@Component({
  selector: 'app-chat-page',
  imports: [ConversationListComponent, MessageListComponent, MessageComposerComponent],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPageComponent {
  readonly chatStore = inject(ChatStoreService);
}
