export type ChatRole = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'streaming';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
