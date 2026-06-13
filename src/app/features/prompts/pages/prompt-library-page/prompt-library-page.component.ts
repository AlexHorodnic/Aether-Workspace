import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideBriefcaseBusiness, LucideCode2, LucideEye, LucideListChecks, LucidePenLine } from '@lucide/angular';
import { PromptCategory, PromptTemplate } from '../../../../core/models/prompt.model';
import { ChatStoreService } from '../../../../core/services/chat-store.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PromptDetailsDrawerComponent } from '../../components/prompt-details-drawer/prompt-details-drawer.component';
import { PROMPT_TEMPLATES } from '../../data/prompt-templates';

@Component({
  selector: 'app-prompt-library-page',
  imports: [
    CommonModule,
    FormsModule,
    EmptyStateComponent,
    PromptDetailsDrawerComponent,
    LucideBriefcaseBusiness,
    LucideCode2,
    LucideEye,
    LucideListChecks,
    LucidePenLine,
  ],
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
  readonly selectedPrompt = signal<PromptTemplate | null>(null);
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

  openDetails(prompt: PromptTemplate): void {
    this.selectedPrompt.set(prompt);
  }

  closeDetails(): void {
    this.selectedPrompt.set(null);
  }

  launchPrompt(prompt: PromptTemplate): void {
    this.closeDetails();
    this.usePrompt(prompt.content);
  }

  badgeFor(prompt: PromptTemplate): string | null {
    const badges: Record<string, string> = {
      'summarize-document': 'Recommended',
      'rewrite-professionally': 'Most Used',
      'create-release-notes': 'New',
    };
    return badges[prompt.id] ?? null;
  }
}
