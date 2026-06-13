export type ChatRole = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'streaming' | 'error';

export interface MessageSource {
  fileId: string;
  fileName: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
  sources?: MessageSource[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
