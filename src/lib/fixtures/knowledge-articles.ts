// Placeholder fixture for the "Knowledge Articles" facet.
// Sample handbook / process docs for the Mission Control template.

export interface KnowledgeArticleFixture {
  id: string;
  title: string;
  category: string;
  summary: string;
  updatedAt: string;
}

export const knowledgeArticles: KnowledgeArticleFixture[] = [
  {
    id: 'kb-1',
    title: 'Onboarding Checklist for New Hires',
    category: 'People',
    summary: 'Step-by-step checklist for first-day setup, access provisioning, and orientation.',
    updatedAt: '2026-07-10T12:00:00Z',
  },
  {
    id: 'kb-2',
    title: 'How to Handle a Customer Escalation',
    category: 'Support',
    summary: 'Escalation path, response timeframes, and communication templates for urgent issues.',
    updatedAt: '2026-07-08T09:30:00Z',
  },
  {
    id: 'kb-3',
    title: 'Project Kickoff Playbook',
    category: 'Operations',
    summary: 'Charter template, stakeholder map, and kickoff meeting agenda for new projects.',
    updatedAt: '2026-07-05T16:00:00Z',
  },
  {
    id: 'kb-4',
    title: 'Monthly Operations Review Guide',
    category: 'Operations',
    summary: 'What to review, who attends, and how to document action items from the monthly ops review.',
    updatedAt: '2026-06-28T14:00:00Z',
  },
];
