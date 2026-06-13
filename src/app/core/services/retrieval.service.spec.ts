import { TestBed } from '@angular/core/testing';
import { IndexedDocumentStoreService } from './indexed-document-store.service';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RetrievalService,
        { provide: IndexedDocumentStoreService, useValue: documents },
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
});
