import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideFolderOpen, LucideMenu, LucideMessageSquare, LucideSearch, LucideSettings, LucideSparkles } from '@lucide/angular';
import { modelProfile } from '../../core/models/settings.model';
import { ChatStoreService } from '../../core/services/chat-store.service';
import { SettingsStoreService } from '../../core/services/settings-store.service';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-workspace-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommandPaletteComponent,
    LucideFolderOpen,
    LucideMenu,
    LucideMessageSquare,
    LucideSearch,
    LucideSettings,
    LucideSparkles,
  ],
  templateUrl: './workspace-layout.component.html',
  styleUrl: './workspace-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceLayoutComponent {
  @ViewChild(CommandPaletteComponent) private commandPalette?: CommandPaletteComponent;

  private readonly settingsStore = inject(SettingsStoreService);
  private readonly chatStore = inject(ChatStoreService);

  readonly sidebarOpen = signal(false);
  readonly settings = this.settingsStore.settings;
  readonly currentConversation = this.chatStore.selectedConversation;
  readonly userInitials = computed(() => this.settings().profileName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase());
  readonly selectedModel = computed(() => modelProfile(this.settings().model));
  readonly navItems: NavItem[] = [
    { label: 'Chat', path: '/chat', icon: 'chat' },
    { label: 'Prompts', path: '/prompts', icon: 'spark' },
    { label: 'Knowledge', path: '/knowledge', icon: 'files' },
    { label: 'Settings', path: '/settings', icon: 'gear' },
  ];

  openPalette(): void {
    this.commandPalette?.show();
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }
}
