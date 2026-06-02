import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AetherModel, ResponseStyle } from '../../../../core/models/settings.model';
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
  readonly models: AetherModel[] = ['Aether Fast', 'Aether Pro', 'Aether Reasoning'];
  readonly styles: ResponseStyle[] = ['Balanced', 'Concise', 'Detailed', 'Executive'];

  updateName(value: string): void {
    this.settingsStore.updateSettings({ profileName: value });
  }

  updateRole(value: string): void {
    this.settingsStore.updateSettings({ profileRole: value });
  }

  updateWorkspace(value: string): void {
    this.settingsStore.updateSettings({ workspaceName: value });
  }

  updateModel(value: string): void {
    if (this.models.includes(value as AetherModel)) {
      this.settingsStore.updateSettings({ model: value as AetherModel });
    }
  }

  updateResponseStyle(value: string): void {
    if (this.styles.includes(value as ResponseStyle)) {
      this.settingsStore.updateSettings({ responseStyle: value as ResponseStyle });
    }
  }

  updateTemperature(value: string): void {
    this.settingsStore.updateSettings({ temperature: Number(value) });
  }
}
