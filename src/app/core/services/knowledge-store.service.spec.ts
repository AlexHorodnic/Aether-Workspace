import { TestBed } from '@angular/core/testing';
import { DocumentExtractorService } from './document-extractor.service';
import { IndexedDocumentStoreService } from './indexed-document-store.service';
import { KnowledgeStoreService } from './knowledge-store.service';

describe('KnowledgeStoreService', () => {
  const extractor = { extract: vi.fn() };
  const documents = { put: vi.fn(), delete: vi.fn() };

  beforeEach(() => {
    if (typeof localStorage.removeItem === 'function') {
      localStorage.removeItem('aether.knowledgeFiles');
    }
    extractor.extract.mockReset();
    documents.put.mockReset().mockResolvedValue(undefined);
    documents.delete.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        KnowledgeStoreService,
        { provide: DocumentExtractorService, useValue: extractor },
        { provide: IndexedDocumentStoreService, useValue: documents },
      ],
    });
  });

  it('extracts, chunks, and indexes a document', async () => {
    extractor.extract.mockResolvedValue('Angular signals improve state management. '.repeat(80));
    const store = TestBed.inject(KnowledgeStoreService);

    await store.addFiles([new File(['content'], 'angular-architecture.md', { type: 'text/markdown' })]);

    expect(store.files()[0]).toMatchObject({
      name: 'angular-architecture.md',
      status: 'Indexed',
      progress: 100,
      collection: 'Engineering',
    });
    expect(documents.put).toHaveBeenCalledWith(expect.objectContaining({
      fileName: 'angular-architecture.md',
      chunks: expect.any(Array),
    }));
  });

  it('records extraction failures without leaving a stuck processing state', async () => {
    extractor.extract.mockRejectedValue(new Error('Unsupported document'));
    const store = TestBed.inject(KnowledgeStoreService);

    await store.addFiles([new File(['content'], 'archive.bin')]);

    expect(store.files()[0]).toMatchObject({
      status: 'Failed',
      progress: 100,
      error: 'Unsupported document',
    });
  });

  it('lets users override the suggested collection', async () => {
    extractor.extract.mockResolvedValue('Useful product requirements with enough readable content.');
    const store = TestBed.inject(KnowledgeStoreService);
    await store.addFiles([new File(['content'], 'requirements.md', { type: 'text/markdown' })]);

    store.updateCollection(store.files()[0].id, 'Research');

    expect(store.files()[0].collection).toBe('Research');
  });

  it('removes document metadata and indexed content together', async () => {
    extractor.extract.mockResolvedValue('Useful meeting transcript with enough readable content.');
    const store = TestBed.inject(KnowledgeStoreService);
    await store.addFiles([new File(['content'], 'meeting-notes.md', { type: 'text/markdown' })]);
    const id = store.files()[0].id;

    await store.removeFile(id);

    expect(store.files()).toEqual([]);
    expect(documents.delete).toHaveBeenCalledWith(id);
  });
});
