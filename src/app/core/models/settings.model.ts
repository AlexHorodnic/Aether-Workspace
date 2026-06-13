export type ThemeMode = 'dark' | 'light';
export type AetherModel = 'SmolLM2 1.7B';
export type ResponseStyle = 'Balanced' | 'Concise' | 'Detailed' | 'Executive';

export interface WorkspaceSettings {
  profileName: string;
  profileRole: string;
  workspaceName: string;
  theme: ThemeMode;
  model: AetherModel;
  temperature: number;
  responseStyle: ResponseStyle;
}
