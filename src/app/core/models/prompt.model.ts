export type PromptCategory = 'Writing' | 'Coding' | 'Business' | 'Productivity';

export interface PromptTemplate {
  id: string;
  title: string;
  category: PromptCategory;
  description: string;
  content: string;
  accent: string;
}
