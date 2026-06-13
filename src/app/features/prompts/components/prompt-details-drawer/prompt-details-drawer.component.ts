import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { LucideCopy, LucideRocket, LucideX } from '@lucide/angular';
import { PromptTemplate } from '../../../../core/models/prompt.model';

@Component({
  selector: 'app-prompt-details-drawer',
  imports: [LucideCopy, LucideRocket, LucideX],
  templateUrl: './prompt-details-drawer.component.html',
  styleUrl: './prompt-details-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptDetailsDrawerComponent {
  readonly prompt = input.required<PromptTemplate>();
  readonly badge = input<string | null>(null);
  readonly close = output<void>();
  readonly launch = output<PromptTemplate>();

  usageFor(prompt: PromptTemplate): { used: string; estimate: string; lastLaunched: string } {
    const usage: Record<string, { used: string; estimate: string; lastLaunched: string }> = {
      'summarize-document': { used: 'Used 34 times', estimate: 'Estimated output: 2-4 min', lastLaunched: 'Last launched yesterday' },
      'rewrite-professionally': { used: 'Used 42 times', estimate: 'Estimated output: 2-5 min', lastLaunched: 'Last launched 2 days ago' },
      'generate-user-stories': { used: 'Used 27 times', estimate: 'Estimated output: 4-7 min', lastLaunched: 'Last launched 4 days ago' },
      'explain-code': { used: 'Used 31 times', estimate: 'Estimated output: 3-6 min', lastLaunched: 'Last launched 3 days ago' },
      'create-release-notes': { used: 'Used 18 times', estimate: 'Estimated output: 3-5 min', lastLaunched: 'Last launched this week' },
      'prepare-interview-questions': { used: 'Used 23 times', estimate: 'Estimated output: 4-8 min', lastLaunched: 'Last launched 5 days ago' },
    };
    return usage[prompt.id] ?? { used: 'Used 12 times', estimate: 'Estimated output: 2-5 min', lastLaunched: 'Last launched recently' };
  }

  copyPrompt(content: string): void {
    void navigator.clipboard?.writeText(content);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}
