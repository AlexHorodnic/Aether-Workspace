import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AetherModel,
  MODEL_PROFILES,
  modelProfile,
  ResponseStyle,
  ThemeMode,
  WorkspaceSettings,
} from '../../../../core/models/settings.model';
import { LocalAiService } from '../../../../core/services/local-ai.service';
import { SettingsStoreService } from '../../../../core/services/settings-store.service';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, DecimalPipe, CardComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  readonly settingsStore = inject(SettingsStoreService);
  private readonly localAi = inject(LocalAiService);

  readonly styles: ResponseStyle[] = ['Balanced', 'Concise', 'Detailed', 'Executive'];
  readonly models = MODEL_PROFILES;
  readonly draft = signal<WorkspaceSettings>({ ...this.settingsStore.settings() });
  readonly selectedModel = computed(() => modelProfile(this.draft().model));
  readonly hasChanges = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.settingsStore.settings()));
  readonly saved = signal(false);
  readonly creativityPresets = [
    { label: 'Precise', value: 0.2, description: 'Consistent factual answers' },
    { label: 'Balanced', value: 0.62, description: 'Useful default for most work' },
    { label: 'Creative', value: 0.9, description: 'More varied language and ideas' },
  ] as const;

  updateName(value: string): void {
    this.patch({ profileName: value });
  }

  updateRole(value: string): void {
    this.patch({ profileRole: value });
  }

  updateWorkspace(value: string): void {
    this.patch({ workspaceName: value });
  }

  updateModel(value: AetherModel): void {
    this.patch({ model: value });
  }

  updateResponseStyle(value: string): void {
    if (this.styles.includes(value as ResponseStyle)) {
      this.patch({ responseStyle: value as ResponseStyle });
    }
  }

  setCreativity(value: number): void {
    this.patch({ temperature: value });
  }

  updateTheme(theme: ThemeMode): void {
    this.patch({ theme });
  }

  discard(): void {
    this.draft.set({ ...this.settingsStore.settings() });
    this.saved.set(false);
  }

  save(): void {
    if (!this.hasChanges()) {
      return;
    }

    const modelChanged = this.draft().model !== this.settingsStore.settings().model;
    this.settingsStore.saveSettings(this.draft());
    this.draft.set({ ...this.settingsStore.settings() });
    this.saved.set(true);
    if (modelChanged) {
      void this.localAi.reset();
    }
    window.setTimeout(() => this.saved.set(false), 2200);
  }

  private patch(partial: Partial<WorkspaceSettings>): void {
    this.draft.update((settings) => ({ ...settings, ...partial }));
    this.saved.set(false);
  }
}
