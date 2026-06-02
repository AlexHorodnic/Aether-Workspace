export type KnowledgeStatus = 'Uploaded' | 'Processing' | 'Indexed';

export interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: KnowledgeStatus;
  createdAt: number;
}
