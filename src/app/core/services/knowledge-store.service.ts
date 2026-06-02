import { Injectable, signal } from '@angular/core';
import { KnowledgeFile } from '../models/knowledge-file.model';
import { createId } from '../utils/id.util';
import { readStorage, writeStorage } from '../utils/storage.util';

const KNOWLEDGE_KEY = 'aether.knowledgeFiles';

function isKnowledgeFile(value: unknown): value is KnowledgeFile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const file = value as Partial<KnowledgeFile>;
  return typeof file.id === 'string'
    && typeof file.name === 'string'
    && typeof file.type === 'string'
    && typeof file.size === 'number'
    && typeof file.progress === 'number'
    && (file.status === 'Uploaded' || file.status === 'Processing' || file.status === 'Indexed')
    && typeof file.createdAt === 'number';
}

function isKnowledgeFiles(value: unknown): value is KnowledgeFile[] {
  return Array.isArray(value) && value.every(isKnowledgeFile);
}

@Injectable({ providedIn: 'root' })
export class KnowledgeStoreService {
  private readonly uploadTimers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly filesState = signal<KnowledgeFile[]>(readStorage<KnowledgeFile[]>(KNOWLEDGE_KEY, [], isKnowledgeFiles));

  readonly files = this.filesState.asReadonly();

  addFiles(fileList: FileList | File[]): void {
    const files = Array.from(fileList);
    if (!files.length) {
      return;
    }

    const metadata = files.map((file): KnowledgeFile => ({
      id: createId('file'),
      name: file.name,
      type: file.type || this.typeFromName(file.name),
      size: file.size,
      progress: 4,
      status: 'Uploaded',
      createdAt: Date.now(),
    }));

    this.filesState.update((current) => [...metadata, ...current]);
    this.persist();
    metadata.forEach((file) => this.mockUpload(file.id));
  }

  removeFile(id: string): void {
    const timer = this.uploadTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.uploadTimers.delete(id);
    }

    this.filesState.update((files) => files.filter((file) => file.id !== id));
    this.persist();
  }

  private mockUpload(id: string): void {
    const timer = setInterval(() => {
      let finished = false;
      this.filesState.update((files) => files.map((file) => {
        if (file.id !== id) {
          return file;
        }

        const progress = Math.min(100, file.progress + 12 + Math.floor(Math.random() * 16));
        finished = progress >= 100;
        return {
          ...file,
          progress,
          status: progress >= 100 ? 'Processing' : 'Uploaded',
        };
      }));
      this.persist();

      if (finished) {
        clearInterval(timer);
        this.uploadTimers.delete(id);
        setTimeout(() => {
          this.filesState.update((files) => files.map((file) => (
            file.id === id ? { ...file, status: 'Indexed', progress: 100 } : file
          )));
          this.persist();
        }, 900);
      }
    }, 220);

    this.uploadTimers.set(id, timer);
  }

  private typeFromName(name: string): string {
    const extension = name.split('.').pop()?.toUpperCase();
    return extension ? `${extension} file` : 'Document';
  }

  private persist(): void {
    writeStorage(KNOWLEDGE_KEY, this.filesState());
  }
}
