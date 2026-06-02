import { Routes } from '@angular/router';
import { WorkspaceLayoutComponent } from './layouts/workspace-layout/workspace-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: WorkspaceLayoutComponent,
    children: [
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/pages/chat-page/chat-page.component').then((m) => m.ChatPageComponent),
      },
      {
        path: 'prompts',
        loadComponent: () => import('./features/prompts/pages/prompt-library-page/prompt-library-page.component').then((m) => m.PromptLibraryPageComponent),
      },
      {
        path: 'knowledge',
        loadComponent: () => import('./features/knowledge/pages/knowledge-base-page/knowledge-base-page.component').then((m) => m.KnowledgeBasePageComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/pages/settings-page/settings-page.component').then((m) => m.SettingsPageComponent),
      },
      { path: '', pathMatch: 'full', redirectTo: 'chat' },
    ],
  },
  { path: '**', redirectTo: 'chat' },
];
