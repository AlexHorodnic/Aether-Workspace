import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PromptCategory } from '../../../../core/models/prompt.model';
import { ChatStoreService } from '../../../../core/services/chat-store.service';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PROMPT_TEMPLATES } from '../../data/prompt-templates';

@Component({
  selector: 'app-prompt-library-page',
  imports: [CommonModule, FormsModule, CardComponent, EmptyStateComponent],
  templateUrl: './prompt-library-page.component.html',
  styleUrl: './prompt-library-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptLibraryPageComponent {
  private readonly chatStore = inject(ChatStoreService);
  private readonly router = inject(Router);

  readonly prompts = PROMPT_TEMPLATES;
  readonly categories: Array<PromptCategory | 'All'> = ['All', 'Writing', 'Coding', 'Business', 'Productivity'];
  readonly search = signal('');
  readonly category = signal<PromptCategory | 'All'>('All');
  readonly filteredPrompts = computed(() => {
    const query = this.search().trim().toLowerCase();
    const category = this.category();
    return this.prompts.filter((prompt) => {
      const matchesCategory = category === 'All' || prompt.category === category;
      const matchesSearch = !query || `${prompt.title} ${prompt.description} ${prompt.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  });

  setSearch(value: string): void {
    this.search.set(value);
  }

  setCategory(category: PromptCategory | 'All'): void {
    this.category.set(category);
  }

  usePrompt(content: string): void {
    this.chatStore.sendPrompt(content);
    void this.router.navigate(['/chat']);
  }
}
