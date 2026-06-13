import { Injectable } from '@angular/core';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'markdown', 'csv', 'json', 'log', 'html', 'css', 'scss', 'ts', 'js']);

@Injectable({ providedIn: 'root' })
export class DocumentExtractorService {
  async extract(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Files must be 8 MB or smaller.');
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (file.type === 'application/pdf' || extension === 'pdf') {
      return this.extractPdf(file);
    }

    if (file.type.startsWith('text/') || TEXT_EXTENSIONS.has(extension)) {
      return this.clean(await file.text());
    }

    throw new Error('Use PDF, TXT, Markdown, CSV, JSON, or source-code files.');
  }

  private async extractPdf(file: File): Promise<string> {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const text = await page.getTextContent();
      pages.push(text.items
        .filter((item): item is typeof item & { str: string } => 'str' in item)
        .map((item) => item.str)
        .join(' '));
    }

    return this.clean(pages.join('\n\n'));
  }

  private clean(value: string): string {
    const content = value.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (content.length < 20) {
      throw new Error('No readable text was found in this file.');
    }
    return content.slice(0, 500_000);
  }
}
