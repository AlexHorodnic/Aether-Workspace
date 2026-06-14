import { computed, inject, Injectable, signal } from '@angular/core';
import type { ChatCompletionMessageParam, WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import { modelProfile, ModelProfile } from '../models/settings.model';
import { StreamingResponseSanitizer } from '../utils/response-sanitizer.util';
import { SettingsStoreService } from './settings-store.service';

export type LocalAiState = 'unsupported' | 'idle' | 'loading' | 'ready' | 'generating' | 'error';

@Injectable({ providedIn: 'root' })
export class LocalAiService {
  private readonly settings = inject(SettingsStoreService);
  private engine: WebWorkerMLCEngine | null = null;
  private worker: Worker | null = null;
  private readonly stateValue = signal<LocalAiState>(this.hasWebGpu() ? 'idle' : 'unsupported');
  private readonly progressValue = signal(0);
  private readonly statusTextValue = signal(this.hasWebGpu() ? 'Local model not loaded' : 'WebGPU is not available');
  private readonly activeProfileValue = signal<ModelProfile | null>(null);
  private readonly usedFallbackValue = signal(false);

  readonly state = this.stateValue.asReadonly();
  readonly progress = this.progressValue.asReadonly();
  readonly statusText = this.statusTextValue.asReadonly();
  readonly activeProfile = this.activeProfileValue.asReadonly();
  readonly usedFallback = this.usedFallbackValue.asReadonly();
  readonly ready = computed(() => this.stateValue() === 'ready');
  readonly busy = computed(() => this.stateValue() === 'loading' || this.stateValue() === 'generating');
  readonly selectedProfile = computed(() => modelProfile(this.settings.settings().model));
  readonly modelName = computed(() => this.activeProfileValue()?.modelName ?? this.selectedProfile().modelName);

  async initialize(): Promise<void> {
    if (this.engine || this.stateValue() === 'loading' || !this.hasWebGpu()) {
      return;
    }

    this.stateValue.set('loading');
    this.statusTextValue.set('Preparing private model...');
    this.usedFallbackValue.set(false);
    const selected = this.selectedProfile();
    try {
      await this.loadProfile(selected);
    } catch (error) {
      await this.releaseEngine();

      if (selected.id !== 'fast' && !this.isGpuCompatibilityError(error)) {
        this.statusTextValue.set(`${selected.modelName} failed. Loading Fast fallback...`);
        this.usedFallbackValue.set(true);
        try {
          await this.loadProfile(modelProfile('fast'));
          return;
        } catch (fallbackError) {
          error = fallbackError;
        }
      }
      await this.fail(error);
    }
  }

  async reset(): Promise<void> {
    await this.releaseEngine();
    this.activeProfileValue.set(null);
    this.progressValue.set(0);
    this.usedFallbackValue.set(false);
    this.stateValue.set(this.hasWebGpu() ? 'idle' : 'unsupported');
    this.statusTextValue.set(this.hasWebGpu() ? 'Local model not loaded' : 'WebGPU is not available');
  }

  async generate(
    messages: ChatCompletionMessageParam[],
    temperature: number,
    onChunk: (content: string) => void,
  ): Promise<string> {
    if (!this.engine) {
      throw new Error('Activate the local model before sending a message.');
    }

    this.stateValue.set('generating');
    this.statusTextValue.set('Generating locally...');
    const sanitizer = new StreamingResponseSanitizer();
    let content = '';
    try {
      const stream = await this.engine.chat.completions.create({
        messages,
        temperature,
        max_tokens: 650,
        stream: true,
      });
      for await (const chunk of stream) {
        const visible = sanitizer.push(chunk.choices[0]?.delta.content ?? '');
        if (visible !== content) {
          content = visible;
          onChunk(content);
        }
      }
      content = sanitizer.finish().trim();
      onChunk(content);
      return content.trim();
    } finally {
      this.stateValue.set('ready');
      this.statusTextValue.set('Private model ready');
    }
  }

  async stop(): Promise<void> {
    if (!this.engine || this.stateValue() !== 'generating') {
      return;
    }

    await this.engine.interruptGenerate();
    this.stateValue.set('ready');
    this.statusTextValue.set('Generation stopped');
  }

  private hasWebGpu(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  private async loadProfile(profile: ModelProfile): Promise<void> {
    const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm');
    this.worker = new Worker(new URL('../../workers/llm.worker', import.meta.url), { type: 'module' });
    this.engine = await CreateWebWorkerMLCEngine(this.worker, profile.modelId, {
      initProgressCallback: (report) => {
        this.progressValue.set(Math.round(report.progress * 100));
        this.statusTextValue.set(report.text);
      },
    });
    this.activeProfileValue.set(profile);
    this.progressValue.set(100);
    this.stateValue.set('ready');
    this.statusTextValue.set(this.usedFallbackValue() ? 'Fast fallback ready' : 'Private model ready');
  }

  private async fail(error: unknown): Promise<void> {
    await this.releaseEngine();
    this.activeProfileValue.set(null);
    this.stateValue.set('error');
    this.statusTextValue.set(this.errorMessage(error));
  }

  private async releaseEngine(): Promise<void> {
    if (this.engine) {
      await this.engine.unload().catch(() => undefined);
    }

    this.worker?.terminate();
    this.engine = null;
    this.worker = null;
  }

  private isGpuCompatibilityError(error: unknown): boolean {
    const detail = error instanceof Error ? error.message : String(error);
    return /compatible gpu|webgpu/i.test(detail);
  }

  private errorMessage(error: unknown): string {
    const detail = error instanceof Error ? error.message : String(error);
    if (/compatible gpu|webgpu/i.test(detail)) {
      return 'No compatible WebGPU device found';
    }
    return detail && detail !== '[object Object]' ? detail : 'The local model could not be loaded.';
  }
}
