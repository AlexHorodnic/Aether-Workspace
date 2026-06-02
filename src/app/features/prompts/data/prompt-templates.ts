import { PromptTemplate } from '../../../core/models/prompt.model';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'summarize-document',
    title: 'Summarize this document',
    category: 'Writing',
    description: 'Create a sharp executive summary with decisions, risks, and next steps.',
    accent: 'violet',
    content: 'Summarize this document for a busy executive. Include context, key points, risks, decisions, and next actions:\n\n[Paste document here]',
  },
  {
    id: 'rewrite-professionally',
    title: 'Rewrite professionally',
    category: 'Writing',
    description: 'Convert rough notes into concise, polished business communication.',
    accent: 'magenta',
    content: 'Rewrite the following text professionally while keeping it concise, clear, and direct:\n\n[Paste text here]',
  },
  {
    id: 'generate-user-stories',
    title: 'Generate user stories',
    category: 'Business',
    description: 'Transform product requirements into user stories and acceptance criteria.',
    accent: 'amber',
    content: 'Generate user stories from these product requirements. Include acceptance criteria, edge cases, and implementation notes:\n\n[Paste requirements here]',
  },
  {
    id: 'explain-code',
    title: 'Explain this code',
    category: 'Coding',
    description: 'Break down code behavior, architecture, risks, and refactor opportunities.',
    accent: 'plum',
    content: 'Explain this code in practical terms. Cover data flow, important decisions, possible bugs, and improvement opportunities:\n\n[Paste code here]',
  },
  {
    id: 'create-release-notes',
    title: 'Create release notes',
    category: 'Productivity',
    description: 'Write customer-facing release notes from shipped work or commits.',
    accent: 'rose',
    content: 'Create polished release notes from the following shipped changes. Separate highlights, improvements, fixes, and migration notes:\n\n[Paste changes here]',
  },
  {
    id: 'prepare-interview-questions',
    title: 'Prepare interview questions',
    category: 'Business',
    description: 'Build structured interview questions with evaluation signals.',
    accent: 'ember',
    content: 'Prepare interview questions for this role. Include core questions, follow-ups, and what strong answers should demonstrate:\n\n[Paste role context here]',
  },
];
