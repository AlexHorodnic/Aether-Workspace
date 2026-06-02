import { computed, Injectable, signal } from '@angular/core';
import { Conversation, ChatMessage } from '../models/chat.models';
import { createId } from '../utils/id.util';
import { readStorage, readStringStorage, writeStorage, writeStringStorage } from '../utils/storage.util';

const CONVERSATIONS_KEY = 'aether.conversations';
const SELECTED_CONVERSATION_KEY = 'aether.selectedConversation';

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<ChatMessage>;
  return typeof message.id === 'string'
    && (message.role === 'user' || message.role === 'assistant')
    && typeof message.content === 'string'
    && typeof message.createdAt === 'number'
    && (message.status === 'complete' || message.status === 'streaming');
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const conversation = value as Partial<Conversation>;
  return typeof conversation.id === 'string'
    && typeof conversation.title === 'string'
    && Array.isArray(conversation.messages)
    && conversation.messages.every(isMessage)
    && typeof conversation.createdAt === 'number'
    && typeof conversation.updatedAt === 'number';
}

function isConversationArray(value: unknown): value is Conversation[] {
  return Array.isArray(value) && value.every(isConversation);
}

@Injectable({ providedIn: 'root' })
export class ChatStoreService {
  private readonly streams = new Map<string, ReturnType<typeof setInterval>>();
  private readonly conversationsState = signal<Conversation[]>(this.restoreConversations());
  private readonly selectedConversationIdState = signal<string | null>(this.restoreSelectedId());

  readonly conversations = this.conversationsState.asReadonly();
  readonly selectedConversationId = this.selectedConversationIdState.asReadonly();
  readonly selectedConversation = computed(() => {
    const selectedId = this.selectedConversationIdState();
    return this.conversationsState().find((conversation) => conversation.id === selectedId) ?? null;
  });

  constructor() {
    this.ensureValidSelection();
    this.persist();
  }

  createConversation(initialMessage?: string): Conversation {
    const now = Date.now();
    const conversation: Conversation = {
      id: createId('chat'),
      title: initialMessage ? this.titleFromMessage(initialMessage) : 'Untitled chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    this.conversationsState.update((conversations) => [conversation, ...conversations]);
    this.selectConversation(conversation.id);
    this.persist();
    return conversation;
  }

  selectConversation(id: string): void {
    const exists = this.conversationsState().some((conversation) => conversation.id === id);
    if (!exists) {
      return;
    }

    this.selectedConversationIdState.set(id);
    writeStringStorage(SELECTED_CONVERSATION_KEY, id);
  }

  renameConversation(id: string, title: string): void {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }

    this.conversationsState.update((conversations) => conversations.map((conversation) => (
      conversation.id === id
        ? { ...conversation, title: cleanTitle, updatedAt: Date.now() }
        : conversation
    )));
    this.persist();
  }

  deleteConversation(id: string): void {
    for (const key of this.streams.keys()) {
      if (key.startsWith(`${id}:`)) {
        this.stopStream(key);
      }
    }

    this.conversationsState.update((conversations) => conversations.filter((conversation) => conversation.id !== id));

    if (this.selectedConversationIdState() === id) {
      this.selectedConversationIdState.set(this.conversationsState()[0]?.id ?? null);
    }

    this.persist();
  }

  sendMessage(content: string): void {
    const cleanContent = content.trim();
    if (!cleanContent) {
      return;
    }

    let conversation = this.selectedConversation();
    if (!conversation) {
      conversation = this.createConversation(cleanContent);
    }

    const now = Date.now();
    const shouldTitle = conversation.messages.length === 0 || conversation.title === 'Untitled chat';
    const userMessage: ChatMessage = {
      id: createId('msg'),
      role: 'user',
      content: cleanContent,
      createdAt: now,
      status: 'complete',
    };
    const assistantMessage: ChatMessage = {
      id: createId('msg'),
      role: 'assistant',
      content: '',
      createdAt: now + 1,
      status: 'streaming',
    };

    const conversationId = conversation.id;
    this.conversationsState.update((conversations) => this.sortByUpdated(conversations.map((item) => (
      item.id === conversationId
        ? {
            ...item,
            title: shouldTitle ? this.titleFromMessage(cleanContent) : item.title,
            messages: [...item.messages, userMessage, assistantMessage],
            updatedAt: now,
          }
        : item
    ))));
    this.persist();
    this.streamAssistantResponse(conversationId, assistantMessage.id, this.createMockResponse(cleanContent));
  }

  sendPrompt(prompt: string): void {
    this.createConversation(prompt);
    this.sendMessage(prompt);
  }

  private restoreConversations(): Conversation[] {
    const conversations = readStorage<Conversation[]>(CONVERSATIONS_KEY, [], isConversationArray);
    return conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        status: message.status === 'streaming' ? 'complete' : message.status,
      })),
    }));
  }

  private restoreSelectedId(): string | null {
    return readStringStorage(SELECTED_CONVERSATION_KEY);
  }

  private ensureValidSelection(): void {
    const selectedId = this.selectedConversationIdState();
    const conversations = this.conversationsState();
    if (selectedId && conversations.some((conversation) => conversation.id === selectedId)) {
      return;
    }

    this.selectedConversationIdState.set(conversations[0]?.id ?? null);
  }

  private persist(): void {
    writeStorage(CONVERSATIONS_KEY, this.conversationsState());
    writeStringStorage(SELECTED_CONVERSATION_KEY, this.selectedConversationIdState());
  }

  private sortByUpdated(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  private titleFromMessage(message: string): string {
    const compact = message.replace(/\s+/g, ' ').trim();
    return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
  }

  private createMockResponse(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('summarize')) {
      return 'I would turn this into a concise executive summary with context, key decisions, risks, and next actions. Add the document text here and I will structure it into scannable bullets.';
    }

    if (lower.includes('code') || lower.includes('typescript') || lower.includes('angular')) {
      return 'Here is a practical analysis path: identify the data flow, isolate side effects, verify edge cases, and add focused tests around the behavior that can regress. For Angular, I would keep state in signals and route-heavy views lazy loaded.';
    }

    if (lower.includes('interview')) {
      return 'I would prepare role-specific questions across product thinking, technical depth, collaboration, and execution. For each question, define what a strong answer proves and what follow-up exposes shallow understanding.';
    }

    return 'I can help turn that into a sharper output. I would clarify the goal, identify the audience, structure the response, and produce a polished draft with concrete next steps.';
  }

  private streamAssistantResponse(conversationId: string, messageId: string, fullResponse: string): void {
    const streamKey = `${conversationId}:${messageId}`;
    this.stopStream(streamKey);

    let index = 0;
    const step = Math.max(2, Math.ceil(fullResponse.length / 55));
    const interval = setInterval(() => {
      index = Math.min(fullResponse.length, index + step);
      const nextContent = fullResponse.slice(0, index);
      const complete = index >= fullResponse.length;

      this.conversationsState.update((conversations) => conversations.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map((message) => (
            message.id === messageId
              ? { ...message, content: nextContent, status: complete ? 'complete' : 'streaming' }
              : message
          )),
          updatedAt: Date.now(),
        };
      }));
      this.persist();

      if (complete) {
        this.stopStream(streamKey);
      }
    }, 28);

    this.streams.set(streamKey, interval);
  }

  private stopStream(streamKey: string): void {
    const stream = this.streams.get(streamKey);
    if (!stream) {
      return;
    }

    clearInterval(stream);
    this.streams.delete(streamKey);
  }
}
