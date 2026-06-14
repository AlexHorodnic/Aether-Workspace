export type ChatRole = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'streaming' | 'error';

export interface MessageSource {
  fileId: string;
  fileName: string;
  excerpt: string;
}

export type SourceScopeKind = 'all' | 'none' | 'collection';

export interface SourceScope {
  kind: SourceScopeKind;
  collection?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
  sources?: MessageSource[];
  sourceScopeLabel?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
