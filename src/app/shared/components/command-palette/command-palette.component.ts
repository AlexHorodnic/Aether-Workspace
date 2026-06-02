import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatStoreService } from '../../../core/services/chat-store.service';
import { PROMPT_TEMPLATES } from '../../../features/prompts/data/prompt-templates';

type CommandKind = 'Action' | 'Conversation' | 'Prompt';

interface CommandItem {
  id: string;
  title: string;
  hint: string;
  kind: CommandKind;
  run: () => void;
}

@Component({
  selector: 'app-command-palette',
  imports: [CommonModule, FormsModule],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly chatStore = inject(ChatStoreService);

  readonly open = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly items = computed(() => this.buildItems());
  readonly filteredItems = computed(() => {
    const query = this.query().trim().toLowerCase();
    const items = this.items();
    if (!query) {
      return items.slice(0, 9);
    }

    return items.filter((item) => `${item.title} ${item.hint} ${item.kind}`.toLowerCase().includes(query)).slice(0, 9);
  });

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const isPaletteShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (isPaletteShortcut) {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (!this.open()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.move(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.move(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.runActive();
    }
  }

  toggle(): void {
    this.open() ? this.close() : this.show();
  }

  show(): void {
    this.open.set(true);
    this.query.set('');
    this.activeIndex.set(0);
    window.setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  close(): void {
    this.open.set(false);
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  setActive(index: number): void {
    this.activeIndex.set(index);
  }

  runItem(item: CommandItem): void {
    item.run();
    this.close();
  }

  private move(delta: number): void {
    const count = this.filteredItems().length;
    if (!count) {
      return;
    }

    this.activeIndex.update((index) => (index + delta + count) % count);
  }

  private runActive(): void {
    const item = this.filteredItems()[this.activeIndex()];
    if (item) {
      this.runItem(item);
    }
  }

  private buildItems(): CommandItem[] {
    const actions: CommandItem[] = [
      {
        id: 'action-new-chat',
        title: 'New chat',
        hint: 'Create a blank conversation',
        kind: 'Action',
        run: () => {
          this.chatStore.createConversation();
          void this.router.navigate(['/chat']);
        },
      },
      { id: 'action-prompts', title: 'Go to prompts', hint: 'Open Prompt Library', kind: 'Action', run: () => void this.router.navigate(['/prompts']) },
      { id: 'action-knowledge', title: 'Go to knowledge base', hint: 'Open uploaded files', kind: 'Action', run: () => void this.router.navigate(['/knowledge']) },
      { id: 'action-settings', title: 'Go to settings', hint: 'Open workspace preferences', kind: 'Action', run: () => void this.router.navigate(['/settings']) },
    ];

    const conversations = this.chatStore.conversations().map((conversation): CommandItem => ({
      id: `conversation-${conversation.id}`,
      title: conversation.title,
      hint: `${conversation.messages.length} messages`,
      kind: 'Conversation',
      run: () => {
        this.chatStore.selectConversation(conversation.id);
        void this.router.navigate(['/chat']);
      },
    }));

    const prompts = PROMPT_TEMPLATES.map((prompt): CommandItem => ({
      id: `prompt-${prompt.id}`,
      title: prompt.title,
      hint: prompt.category,
      kind: 'Prompt',
      run: () => {
        this.chatStore.sendPrompt(prompt.content);
        void this.router.navigate(['/chat']);
      },
    }));

    return [...actions, ...conversations, ...prompts];
  }
}
