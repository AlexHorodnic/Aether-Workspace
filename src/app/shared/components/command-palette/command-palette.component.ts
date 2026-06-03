import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatStoreService } from '../../../core/services/chat-store.service';
import { KnowledgeStoreService } from '../../../core/services/knowledge-store.service';
import { PROMPT_TEMPLATES } from '../../../features/prompts/data/prompt-templates';

type CommandKind = 'Action' | 'Conversation' | 'Prompt' | 'File';
type CommandIcon = 'plus' | 'chat' | 'prompt' | 'knowledge' | 'settings' | 'file';
type SectionTitle = 'Recent' | 'Actions' | 'Conversations' | 'Prompts' | 'Knowledge';

interface CommandItem {
  id: string;
  title: string;
  hint: string;
  kind: CommandKind;
  section: Exclude<SectionTitle, 'Recent'>;
  icon: CommandIcon;
  run: () => void;
}

interface HighlightSegment {
  text: string;
  matched: boolean;
}

interface PaletteEntry {
  item: CommandItem;
  globalIndex: number;
}

interface CommandSection {
  title: SectionTitle;
  entries: PaletteEntry[];
}

interface MatchResult {
  item: CommandItem;
  score: number;
}

const RECENT_KEY = 'aether.commandPalette.recent';

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
  private readonly knowledgeStore = inject(KnowledgeStoreService);
  private readonly recentIds = signal<string[]>(this.readRecentIds());

  readonly open = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly items = computed(() => this.buildItems());
  readonly visibleItems = computed(() => this.getVisibleItems());
  readonly sections = computed(() => this.groupItems(this.visibleItems()));

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
    this.remember(item.id);
    item.run();
    this.close();
  }

  highlight(value: string): HighlightSegment[] {
    const query = this.query().trim();
    if (!query) {
      return [{ text: value, matched: false }];
    }

    const matches = this.matchIndexes(value, query);
    if (!matches.length) {
      return [{ text: value, matched: false }];
    }

    const matchSet = new Set(matches);
    const segments: HighlightSegment[] = [];
    let current = '';
    let currentMatched = matchSet.has(0);

    for (let index = 0; index < value.length; index++) {
      const matched = matchSet.has(index);
      if (matched !== currentMatched && current) {
        segments.push({ text: current, matched: currentMatched });
        current = '';
      }
      current += value[index];
      currentMatched = matched;
    }

    if (current) {
      segments.push({ text: current, matched: currentMatched });
    }

    return segments;
  }

  private move(delta: number): void {
    const count = this.visibleItems().length;
    if (!count) {
      return;
    }

    this.activeIndex.update((index) => (index + delta + count) % count);
  }

  private runActive(): void {
    const item = this.visibleItems()[this.activeIndex()];
    if (item) {
      this.runItem(item);
    }
  }

  private getVisibleItems(): CommandItem[] {
    const query = this.query().trim();
    const items = this.items();

    if (!query) {
      const recent = this.recentIds()
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is CommandItem => Boolean(item));

      return [...recent, ...items.filter((item) => item.section === 'Actions')]
        .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
        .slice(0, 8);
    }

    return items
      .map((item): MatchResult | null => {
        const score = this.fuzzyScore(`${item.title} ${item.hint} ${item.section}`, query);
        return score === null ? null : { item, score };
      })
      .filter((result): result is MatchResult => result !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((result) => result.item);
  }

  private groupItems(items: CommandItem[]): CommandSection[] {
    const titles: SectionTitle[] = this.query().trim() ? ['Actions', 'Conversations', 'Prompts', 'Knowledge'] : ['Recent', 'Actions', 'Conversations', 'Prompts', 'Knowledge'];
    let globalIndex = 0;

    return titles
      .map((title): CommandSection => {
        const sectionItems = title === 'Recent'
          ? items.filter((item) => this.recentIds().includes(item.id) || (this.recentIds().length === 0 && item.section === 'Actions'))
          : items.filter((item) => item.section === title);

        const entries = sectionItems.map((item) => ({ item, globalIndex: globalIndex++ }));
        return { title, entries };
      })
      .filter((section) => section.entries.length > 0);
  }

  private buildItems(): CommandItem[] {
    const actions: CommandItem[] = [
      {
        id: 'action-new-chat',
        title: 'New chat',
        hint: 'Create a blank conversation',
        kind: 'Action',
        section: 'Actions',
        icon: 'plus',
        run: () => {
          this.chatStore.createConversation();
          void this.router.navigate(['/chat']);
        },
      },
      { id: 'action-prompts', title: 'Go to prompts', hint: 'Open Prompt Library', kind: 'Action', section: 'Actions', icon: 'prompt', run: () => void this.router.navigate(['/prompts']) },
      { id: 'action-knowledge', title: 'Go to knowledge base', hint: 'Open uploaded files', kind: 'Action', section: 'Actions', icon: 'knowledge', run: () => void this.router.navigate(['/knowledge']) },
      { id: 'action-settings', title: 'Go to settings', hint: 'Open workspace preferences', kind: 'Action', section: 'Actions', icon: 'settings', run: () => void this.router.navigate(['/settings']) },
    ];

    const conversations = this.chatStore.conversations().map((conversation): CommandItem => ({
      id: `conversation-${conversation.id}`,
      title: conversation.title,
      hint: `${conversation.messages.length} messages`,
      kind: 'Conversation',
      section: 'Conversations',
      icon: 'chat',
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
      section: 'Prompts',
      icon: 'prompt',
      run: () => {
        this.chatStore.sendPrompt(prompt.content);
        void this.router.navigate(['/chat']);
      },
    }));

    const files = this.knowledgeStore.files().map((file): CommandItem => ({
      id: `file-${file.id}`,
      title: file.name,
      hint: `${file.status} knowledge file`,
      kind: 'File',
      section: 'Knowledge',
      icon: 'file',
      run: () => void this.router.navigate(['/knowledge']),
    }));

    return [...actions, ...conversations, ...prompts, ...files];
  }

  private fuzzyScore(value: string, query: string): number | null {
    const haystack = value.toLowerCase();
    const needle = query.toLowerCase();
    let queryIndex = 0;
    let score = 0;
    let streak = 0;

    for (let index = 0; index < haystack.length && queryIndex < needle.length; index++) {
      if (haystack[index] !== needle[queryIndex]) {
        streak = 0;
        continue;
      }

      score += 8 + streak * 4;
      if (index === 0 || haystack[index - 1] === ' ') {
        score += 8;
      }
      streak++;
      queryIndex++;
    }

    return queryIndex === needle.length ? score - haystack.length * 0.04 : null;
  }

  private matchIndexes(value: string, query: string): number[] {
    const matches: number[] = [];
    const haystack = value.toLowerCase();
    const needle = query.toLowerCase();
    let queryIndex = 0;

    for (let index = 0; index < haystack.length && queryIndex < needle.length; index++) {
      if (haystack[index] === needle[queryIndex]) {
        matches.push(index);
        queryIndex++;
      }
    }

    return queryIndex === needle.length ? matches : [];
  }

  private remember(id: string): void {
    const nextIds = [id, ...this.recentIds().filter((itemId) => itemId !== id)].slice(0, 6);
    this.recentIds.set(nextIds);

    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(nextIds));
    } catch {
      // Recent commands are optional; palette behavior should not depend on storage.
    }
  }

  private readRecentIds(): string[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
      return Array.isArray(parsed) && parsed.every((id) => typeof id === 'string') ? parsed.slice(0, 6) : [];
    } catch {
      return [];
    }
  }
}
