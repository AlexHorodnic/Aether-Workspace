import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { WorkspaceSettings } from '../models/settings.model';
import { readStorage, writeStorage } from '../utils/storage.util';

const SETTINGS_KEY = 'aether.settings';

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  profileName: 'Alex Morgan',
  profileRole: 'Product Designer',
  workspaceName: 'Aether Workspace',
  theme: 'dark',
  model: 'Aether Pro',
  temperature: 0.62,
  responseStyle: 'Balanced',
};

function isWorkspaceSettings(value: unknown): value is WorkspaceSettings {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const settings = value as Partial<WorkspaceSettings>;
  return typeof settings.profileName === 'string'
    && typeof settings.profileRole === 'string'
    && typeof settings.workspaceName === 'string'
    && (settings.theme === 'dark' || settings.theme === 'light')
    && (settings.model === 'Aether Fast' || settings.model === 'Aether Pro' || settings.model === 'Aether Reasoning')
    && typeof settings.temperature === 'number'
    && settings.temperature >= 0
    && settings.temperature <= 1
    && (settings.responseStyle === 'Balanced' || settings.responseStyle === 'Concise' || settings.responseStyle === 'Detailed' || settings.responseStyle === 'Executive');
}

@Injectable({ providedIn: 'root' })
export class SettingsStoreService {
  private readonly document = inject(DOCUMENT);
  private readonly settingsState = signal<WorkspaceSettings>(readStorage<WorkspaceSettings>(SETTINGS_KEY, DEFAULT_SETTINGS, isWorkspaceSettings));

  readonly settings = this.settingsState.asReadonly();

  constructor() {
    effect(() => {
      const settings = this.settingsState();
      this.document.documentElement.dataset['theme'] = settings.theme;
      writeStorage(SETTINGS_KEY, settings);
    });
  }

  updateSettings(partial: Partial<WorkspaceSettings>): void {
    this.settingsState.update((settings) => ({
      ...settings,
      ...partial,
      temperature: partial.temperature === undefined ? settings.temperature : this.clamp(partial.temperature),
    }));
  }

  toggleTheme(): void {
    this.settingsState.update((settings) => ({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    }));
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }
}
