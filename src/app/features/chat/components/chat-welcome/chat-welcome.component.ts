import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChatStoreService } from '../../../../core/services/chat-store.service';

@Component({
  selector: 'app-chat-welcome',
  imports: [],
  templateUrl: './chat-welcome.component.html',
  styleUrl: './chat-welcome.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWelcomeComponent {
  private readonly chatStore = inject(ChatStoreService);
  private readonly router = inject(Router);

  startChat(): void {
    this.chatStore.createConversation();
  }

  openPrompts(): void {
    void this.router.navigate(['/prompts']);
  }

  openKnowledge(): void {
    void this.router.navigate(['/knowledge']);
  }
}
