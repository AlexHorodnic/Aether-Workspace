import { inject, Injectable, signal } from '@angular/core';
import { KnowledgeDocument, KnowledgeFile } from '../models/knowledge-file.model';
import { createId } from '../utils/id.util';
import { readStorage, writeStorage } from '../utils/storage.util';
import { DocumentExtractorService } from './document-extractor.service';
import { IndexedDocumentStoreService } from './indexed-document-store.service';

const KNOWLEDGE_KEY = 'aether.knowledgeFiles';
const COLLECTIONS = ['Product Docs', 'Engineering', 'Research', 'Personal Notes', 'Meeting Notes'] as const;

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
    && (file.status === 'Processing' || file.status === 'Indexed' || file.status === 'Failed')
    && typeof file.collection === 'string'
    && typeof file.wordCount === 'number'
    && typeof file.createdAt === 'number';
}

function isKnowledgeFiles(value: unknown): value is KnowledgeFile[] {
  return Array.isArray(value) && value.every(isKnowledgeFile);
}

@Injectable({ providedIn: 'root' })
export class KnowledgeStoreService {
  private readonly extractor = inject(DocumentExtractorService);
  private readonly documents = inject(IndexedDocumentStoreService);
  private readonly filesState = signal<KnowledgeFile[]>(readStorage<KnowledgeFile[]>(KNOWLEDGE_KEY, [], isKnowledgeFiles));

  readonly files = this.filesState.asReadonly();
  readonly collections = COLLECTIONS;

  async addFiles(fileList: FileList | File[]): Promise<void> {
    for (const file of Array.from(fileList)) {
      await this.processFile(file);
    }
  }

  async removeFile(id: string): Promise<void> {
    this.filesState.update((files) => files.filter((file) => file.id !== id));
    this.persist();
    await this.documents.delete(id);
  }

  updateCollection(id: string, collection: string): void {
    if (!COLLECTIONS.includes(collection as typeof COLLECTIONS[number])) {
      return;
    }
    this.filesState.update((files) => files.map((file) => file.id === id ? { ...file, collection } : file));
    this.persist();
  }

  private async processFile(file: File): Promise<void> {
    const id = createId('file');
    const metadata: KnowledgeFile = {
      id,
      name: file.name,
      type: file.type || this.typeFromName(file.name),
      size: file.size,
      progress: 12,
      status: 'Processing',
      collection: this.suggestCollection(file),
      wordCount: 0,
      createdAt: Date.now(),
    };

    this.filesState.update((current) => [metadata, ...current]);
    this.persist();

    try {
      this.updateFile(id, { progress: 45 });
      const content = await this.extractor.extract(file);
      const document: KnowledgeDocument = {
        id,
        fileName: file.name,
        content,
        chunks: this.chunk(content),
      };
      this.updateFile(id, { progress: 82 });
      await this.documents.put(document);
      this.updateFile(id, {
        progress: 100,
        status: 'Indexed',
        wordCount: content.split(/\s+/).filter(Boolean).length,
      });
    } catch (error) {
      this.updateFile(id, {
        progress: 100,
        status: 'Failed',
        error: error instanceof Error ? error.message : 'This document could not be processed.',
      });
    }
  }

  private updateFile(id: string, partial: Partial<KnowledgeFile>): void {
    this.filesState.update((files) => files.map((file) => file.id === id ? { ...file, ...partial } : file));
    this.persist();
  }

  private chunk(content: string): string[] {
    const paragraphs = content.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
    const chunks: string[] = [];
    let current = '';

    for (const paragraph of paragraphs) {
      if (current && current.length + paragraph.length > 1_200) {
        chunks.push(current);
        current = '';
      }
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
    if (current) {
      chunks.push(current);
    }
    return chunks.length ? chunks : [content.slice(0, 1_200)];
  }

  private suggestCollection(file: File): string {
    const name = file.name.toLowerCase();
    if (/(meeting|standup|transcript)/.test(name)) return 'Meeting Notes';
    if (/(research|market|benchmark|study)/.test(name)) return 'Research';
    if (/(architecture|api|angular|typescript|code)/.test(name) || file.type.startsWith('text/x-')) return 'Engineering';
    if (/(personal|notes|journal)/.test(name)) return 'Personal Notes';
    return 'Product Docs';
  }

  private typeFromName(name: string): string {
    const extension = name.split('.').pop()?.toUpperCase();
    return extension ? `${extension} file` : 'Document';
  }

  private persist(): void {
    writeStorage(KNOWLEDGE_KEY, this.filesState());
  }
}
