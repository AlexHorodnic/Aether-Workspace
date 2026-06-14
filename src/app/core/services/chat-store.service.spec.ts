import { TestBed } from '@angular/core/testing';
import { DEFAULT_SETTINGS } from './settings-store.service';
import { ChatStoreService } from './chat-store.service';
import { LocalAiService } from './local-ai.service';
import { PromptGuardService } from './prompt-guard.service';
import { RetrievalService } from './retrieval.service';
import { SettingsStoreService } from './settings-store.service';

describe('ChatStoreService', () => {
  const ai = {
    ready: vi.fn(() => true),
    busy: vi.fn(() => false),
    generate: vi.fn(async (_messages, _temperature, onChunk: (content: string) => void) => {
      onChunk('Draft answer');
      return 'Final answer';
    }),
    stop: vi.fn().mockResolvedValue(undefined),
  };
  const guard = { check: vi.fn(() => ({ allowed: true })) };
  const retrieval = {
    retrieve: vi.fn().mockResolvedValue({
      context: '[Source 1: architecture.md]\nSignals are reactive.',
      sources: [{ fileId: 'doc-1', fileName: 'architecture.md', excerpt: 'Signals are reactive.' }],
    }),
  };
  const settings = { settings: vi.fn(() => DEFAULT_SETTINGS) };

  beforeEach(() => {
    if (typeof localStorage.removeItem === 'function') {
      localStorage.removeItem('aether.conversations');
      localStorage.removeItem('aether.selectedConversation');
    }
    vi.clearAllMocks();
    ai.ready.mockReturnValue(true);
    ai.busy.mockReturnValue(false);
    retrieval.retrieve.mockResolvedValue({
      context: '[Source 1: architecture.md]\nSignals are reactive.',
      sources: [{ fileId: 'doc-1', fileName: 'architecture.md', excerpt: 'Signals are reactive.' }],
    });

    TestBed.configureTestingModule({
      providers: [
        ChatStoreService,
        { provide: LocalAiService, useValue: ai },
        { provide: PromptGuardService, useValue: guard },
        { provide: RetrievalService, useValue: retrieval },
        { provide: SettingsStoreService, useValue: settings },
      ],
    });
  });

  it('stages prompt templates for editing instead of sending them', () => {
    const store = TestBed.inject(ChatStoreService);

    store.preparePrompt('Summarize:\n\n[Paste document here]');

    expect(store.composerDraft()).toContain('[Paste document here]');
    expect(store.conversations()).toEqual([]);
  });

  it('passes the selected source scope into retrieval', async () => {
    const store = TestBed.inject(ChatStoreService);
    store.setSourceScope({ kind: 'collection', collection: 'Engineering' });

    await store.sendMessage('How do signals work?');

    expect(retrieval.retrieve).toHaveBeenCalledWith(
      'How do signals work?',
      { kind: 'collection', collection: 'Engineering' },
    );
    expect(store.selectedConversation()?.messages.at(-1)?.sourceScopeLabel).toBe('Engineering');
    expect(store.selectedConversation()?.messages.at(-1)?.sourceUsage).toBe('grounded');
  });

  it('marks a selected scope without matches as a general fallback', async () => {
    retrieval.retrieve.mockResolvedValue({ context: '', sources: [] });
    const store = TestBed.inject(ChatStoreService);
    store.setSourceScope({ kind: 'collection', collection: 'Engineering' });

    await store.sendMessage('What is the launch date?');

    const assistant = store.selectedConversation()?.messages.at(-1);
    expect(assistant?.sourceScopeLabel).toBe('Engineering');
    expect(assistant?.sourceUsage).toBe('no-match');
    expect(ai.generate.mock.calls.at(-1)?.[0][0].content).toContain(
      'never claim or imply that the answer is source-grounded',
    );
  });

  it('marks retrieval-disabled answers as general knowledge', async () => {
    retrieval.retrieve.mockResolvedValue({ context: '', sources: [] });
    const store = TestBed.inject(ChatStoreService);
    store.setSourceScope({ kind: 'none' });

    await store.sendMessage('What is two plus two?');

    expect(store.selectedConversation()?.messages.at(-1)?.sourceUsage).toBe('general');
  });

  it('reuses the previous user message when regenerating', async () => {
    const store = TestBed.inject(ChatStoreService);
    await store.sendMessage('Explain this architecture');
    const assistant = store.selectedConversation()?.messages.at(-1);

    await store.regenerate(assistant!.id);

    expect(ai.generate).toHaveBeenCalledTimes(2);
    expect(store.selectedConversation()?.messages.at(-1)?.content).toBe('Final answer');
  });

  it('creates a short intent title instead of copying the user message', async () => {
    const store = TestBed.inject(ChatStoreService);

    await store.sendMessage('Could you please explain how Angular signals work in this application?');

    expect(store.selectedConversation()?.title).toBe('Angular Signals Application Overview');
  });
});
