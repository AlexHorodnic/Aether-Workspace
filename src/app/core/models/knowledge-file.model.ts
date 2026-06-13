export type KnowledgeStatus = 'Processing' | 'Indexed' | 'Failed';

export interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: KnowledgeStatus;
  collection: string;
  wordCount: number;
  error?: string;
  createdAt: number;
}

export interface KnowledgeDocument {
  id: string;
  fileName: string;
  content: string;
  chunks: string[];
}
