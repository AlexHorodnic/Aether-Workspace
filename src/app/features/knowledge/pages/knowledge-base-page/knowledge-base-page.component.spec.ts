import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { KnowledgeStoreService } from '../../../../core/services/knowledge-store.service';
import { KnowledgeBasePageComponent } from './knowledge-base-page.component';

describe('KnowledgeBasePageComponent', () => {
  it('filters and focuses a file requested by the command palette', () => {
    TestBed.configureTestingModule({
      imports: [KnowledgeBasePageComponent],
      providers: [
        {
          provide: KnowledgeStoreService,
          useValue: {
            files: signal([
              {
                id: 'file-1',
                name: 'architecture.md',
                type: 'text/markdown',
                size: 120,
                progress: 100,
                status: 'Indexed',
                collection: 'Engineering',
                wordCount: 20,
                createdAt: Date.now(),
              },
            ]),
            collections: ['Engineering'],
            updateCollection: vi.fn(),
            removeFile: vi.fn(),
            addFiles: vi.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({ file: 'file-1' })),
            snapshot: { queryParamMap: convertToParamMap({ file: 'file-1' }) },
          },
        },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      ],
    });

    const component = TestBed.createComponent(KnowledgeBasePageComponent).componentInstance;

    expect(component.search()).toBe('');
    expect(component.focusedFileId()).toBe('file-1');
    expect(component.filteredFiles().map((file) => file.id)).toEqual(['file-1']);
  });
});
