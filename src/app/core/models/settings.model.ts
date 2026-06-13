export type ThemeMode = 'dark' | 'light';
export type AetherModel = 'fast' | 'balanced' | 'smart' | 'high-quality';
export type ResponseStyle = 'Balanced' | 'Concise' | 'Detailed' | 'Executive';

export interface ModelProfile {
  id: AetherModel;
  label: string;
  modelName: string;
  modelId: string;
  description: string;
  vramMb: number;
  tone: 'violet' | 'blue' | 'amber' | 'pink';
}

export const MODEL_PROFILES: readonly ModelProfile[] = [
  {
    id: 'fast',
    label: 'Fast',
    modelName: 'SmolLM2 1.7B',
    modelId: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    description: 'Quick drafts and lightweight devices',
    vramMb: 1775,
    tone: 'violet',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    modelName: 'Llama 3.2 3B',
    modelId: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    description: 'Stronger general answers at moderate cost',
    vramMb: 2264,
    tone: 'blue',
  },
  {
    id: 'smart',
    label: 'Smart',
    modelName: 'Qwen 2.5 3B',
    modelId: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    description: 'Reasoning, coding, and detailed analysis',
    vramMb: 2505,
    tone: 'amber',
  },
  {
    id: 'high-quality',
    label: 'High Quality',
    modelName: 'Qwen 3 4B',
    modelId: 'Qwen3-4B-q4f16_1-MLC',
    description: 'Best local quality for capable GPUs',
    vramMb: 3432,
    tone: 'pink',
  },
];

export function modelProfile(id: AetherModel): ModelProfile {
  return MODEL_PROFILES.find((profile) => profile.id === id) ?? MODEL_PROFILES[0];
}

export interface WorkspaceSettings {
  profileName: string;
  profileRole: string;
  workspaceName: string;
  theme: ThemeMode;
  model: AetherModel;
  temperature: number;
  responseStyle: ResponseStyle;
}
