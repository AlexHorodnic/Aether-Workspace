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

  copyPrompt(content: string): void {
    void navigator.clipboard?.writeText(content);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}
