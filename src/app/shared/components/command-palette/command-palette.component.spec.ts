import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ChatStoreService } from '../../../core/services/chat-store.service';
import { KnowledgeStoreService } from '../../../core/services/knowledge-store.service';
import { CommandPaletteComponent } from './command-palette.component';

describe('CommandPaletteComponent', () => {
  it('opens a file result at its focused Knowledge URL', () => {
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ChatStoreService,
          useValue: {
            conversations: signal([]),
            createConversation: vi.fn(),
            selectConversation: vi.fn(),
            preparePrompt: vi.fn(),
          },
        },
        {
          provide: KnowledgeStoreService,
          useValue: {
            files: signal([{ id: 'file-1', name: 'architecture.md', status: 'Indexed' }]),
          },
        },
      ],
    });

    const component = TestBed.createComponent(CommandPaletteComponent).componentInstance;
    const file = component.items().find((item) => item.kind === 'File');
    component.runItem(file!);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/knowledge'],
      { queryParams: { file: 'file-1' } },
    );
  });
});
