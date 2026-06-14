import { TestBed } from '@angular/core/testing';
import { IndexedDocumentStoreService } from './indexed-document-store.service';
import { KnowledgeStoreService } from './knowledge-store.service';
import { RetrievalService } from './retrieval.service';

describe('RetrievalService', () => {
  const documents = {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'angular',
        fileName: 'architecture.md',
        content: 'Angular architecture',
        chunks: ['Angular signals keep derived state predictable and reduce manual subscriptions.'],
      },
      {
        id: 'marketing',
        fileName: 'campaign.md',
        content: 'Campaign notes',
        chunks: ['The launch campaign targets product leaders in Europe.'],
      },
    ]),
  };
  const knowledge = {
    files: vi.fn(() => [
      { id: 'angular', collection: 'Engineering', status: 'Indexed' },
      { id: 'marketing', collection: 'Research', status: 'Indexed' },
    ]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RetrievalService,
        { provide: IndexedDocumentStoreService, useValue: documents },
        { provide: KnowledgeStoreService, useValue: knowledge },
      ],
    });
  });

  it('returns the most relevant local source', async () => {
    const result = await TestBed.inject(RetrievalService).retrieve('How are Angular signals used?');
    expect(result.sources[0].fileName).toBe('architecture.md');
    expect(result.context).toContain('[Source 1: architecture.md]');
  });

  it('returns no context when nothing matches', async () => {
    const result = await TestBed.inject(RetrievalService).retrieve('quantum chemistry');
    expect(result).toEqual({ context: '', sources: [] });
  });

  it('limits retrieval to the selected collection', async () => {
    const result = await TestBed.inject(RetrievalService).retrieve(
      'product leaders Angular signals',
      { kind: 'collection', collection: 'Research' },
    );

    expect(result.sources.map((source) => source.fileName)).toEqual(['campaign.md']);
  });

  it('skips workspace retrieval for general knowledge mode', async () => {
    const result = await TestBed.inject(RetrievalService).retrieve('Angular signals', { kind: 'none' });
    expect(result).toEqual({ context: '', sources: [] });
  });
});
