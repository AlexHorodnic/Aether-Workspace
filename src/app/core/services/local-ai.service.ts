import { computed, Injectable, signal } from '@angular/core';
import type { ChatCompletionMessageParam, WebWorkerMLCEngine } from '@mlc-ai/web-llm';

export type LocalAiState = 'unsupported' | 'idle' | 'loading' | 'ready' | 'generating' | 'error';

const MODEL_ID = 'SmolLM2-1.7B-Instruct-q4f16_1-MLC';

@Injectable({ providedIn: 'root' })
export class LocalAiService {
  private engine: WebWorkerMLCEngine | null = null;
  private readonly stateValue = signal<LocalAiState>(this.hasWebGpu() ? 'idle' : 'unsupported');
  private readonly progressValue = signal(0);
  private readonly statusTextValue = signal(this.hasWebGpu() ? 'Local model not loaded' : 'WebGPU is not available');

  readonly state = this.stateValue.asReadonly();
  readonly progress = this.progressValue.asReadonly();
  readonly statusText = this.statusTextValue.asReadonly();
  readonly ready = computed(() => this.stateValue() === 'ready');
  readonly busy = computed(() => this.stateValue() === 'loading' || this.stateValue() === 'generating');
  readonly modelName = 'SmolLM2 1.7B';

  async initialize(): Promise<void> {
    if (this.engine || this.stateValue() === 'loading' || !this.hasWebGpu()) {
      return;
    }

    this.stateValue.set('loading');
    this.statusTextValue.set('Preparing private model...');
    try {
      const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm');
      const worker = new Worker(new URL('../../workers/llm.worker', import.meta.url), { type: 'module' });
      this.engine = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
        initProgressCallback: (report) => {
          this.progressValue.set(Math.round(report.progress * 100));
          this.statusTextValue.set(report.text);
        },
      });
      this.progressValue.set(100);
      this.stateValue.set('ready');
      this.statusTextValue.set('Private model ready');
    } catch (error) {
      this.engine = null;
      this.stateValue.set('error');
      this.statusTextValue.set(this.errorMessage(error));
    }
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
    let content = '';
    try {
      const stream = await this.engine.chat.completions.create({
        messages,
        temperature,
        max_tokens: 650,
        stream: true,
      });
      for await (const chunk of stream) {
        content += chunk.choices[0]?.delta.content ?? '';
        onChunk(content);
      }
      return content.trim();
    } finally {
      this.stateValue.set('ready');
      this.statusTextValue.set('Private model ready');
    }
  }

  private hasWebGpu(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  private errorMessage(error: unknown): string {
    const detail = error instanceof Error ? error.message : String(error);
    if (/compatible gpu|webgpu/i.test(detail)) {
      return 'No compatible WebGPU device found';
    }
    return detail && detail !== '[object Object]' ? detail : 'The local model could not be loaded.';
  }
}
