import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
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
export class MessageListComponent {
  private readonly settingsStore = inject(SettingsStoreService);

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
}
