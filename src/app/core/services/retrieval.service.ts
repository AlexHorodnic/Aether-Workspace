import { inject, Injectable } from '@angular/core';
import { MessageSource, SourceScope } from '../models/chat.models';
import { IndexedDocumentStoreService } from './indexed-document-store.service';
import { KnowledgeStoreService } from './knowledge-store.service';

export interface RetrievalContext {
  context: string;
  sources: MessageSource[];
}

@Injectable({ providedIn: 'root' })
export class RetrievalService {
  private readonly documents = inject(IndexedDocumentStoreService);
  private readonly knowledge = inject(KnowledgeStoreService);

  async retrieve(query: string, scope: SourceScope = { kind: 'all' }, limit = 4): Promise<RetrievalContext> {
    if (scope.kind === 'none') {
      return { context: '', sources: [] };
    }

    const terms = this.terms(query);
    if (!terms.length) {
      return { context: '', sources: [] };
    }

    let documents;
    try {
      documents = await this.documents.getAll();
    } catch {
      return { context: '', sources: [] };
    }
    const allowedIds = scope.kind === 'collection'
      ? new Set(this.knowledge.files().filter((file) => file.collection === scope.collection && file.status === 'Indexed').map((file) => file.id))
      : null;
    const ranked = documents
      .filter((document) => !allowedIds || allowedIds.has(document.id))
      .flatMap((document) => document.chunks.map((chunk) => ({
        document,
        chunk,
        score: this.score(chunk, terms),
      })))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const sources = ranked.map(({ document, chunk }) => ({
      fileId: document.id,
      fileName: document.fileName,
      excerpt: chunk.slice(0, 180).trim(),
    }));

    return {
      sources,
      context: ranked.map(({ document, chunk }, index) => (
        `[Source ${index + 1}: ${document.fileName}]\n${chunk}`
      )).join('\n\n'),
    };
  }

  private score(chunk: string, terms: string[]): number {
    const normalized = chunk.toLowerCase();
    return terms.reduce((score, term) => {
      const matches = normalized.split(term).length - 1;
      return score + Math.min(matches, 5) * (term.length > 6 ? 2 : 1);
    }, 0);
  }

  private terms(value: string): string[] {
    return [...new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [])]
      .filter((term) => !['the', 'and', 'for', 'that', 'this', 'with', 'from', 'what', 'how', 'are'].includes(term));
  }
}
