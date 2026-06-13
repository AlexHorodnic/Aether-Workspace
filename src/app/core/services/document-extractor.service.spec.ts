import { TestBed } from '@angular/core/testing';
import { DocumentExtractorService } from './document-extractor.service';

describe('DocumentExtractorService', () => {
  let extractor: DocumentExtractorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    extractor = TestBed.inject(DocumentExtractorService);
  });

  it('extracts and normalizes text documents', async () => {
    const file = new File(['Architecture   decisions\n\n\nAngular signals'], 'notes.md', { type: 'text/markdown' });
    await expect(extractor.extract(file)).resolves.toBe('Architecture decisions\n\nAngular signals');
  });

  it('rejects unsupported binary formats', async () => {
    const file = new File(['binary content that is long enough'], 'photo.png', { type: 'image/png' });
    await expect(extractor.extract(file)).rejects.toThrow('Use PDF, TXT, Markdown');
  });

  it('rejects documents without useful text', async () => {
    const file = new File(['short'], 'notes.txt', { type: 'text/plain' });
    await expect(extractor.extract(file)).rejects.toThrow('No readable text');
  });
});
