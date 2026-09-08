// Placeholder fixture for the "Customer Support" facet.
// Sample support tickets for the VBA template.

export interface SupportTicketFixture {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  customer: string;
  channel: string;
  createdAt: string;
}

export const supportTickets: SupportTicketFixture[] = [
  {
    id: 'TKT-001',
    subject: 'Cannot access account after password reset',
    status: 'open',
    priority: 'high',
    customer: 'Jamie Ellis',
    channel: 'Email',
    createdAt: '2026-07-17T09:15:00Z',
  },
  {
    id: 'TKT-002',
    subject: 'Feature request: export to CSV',
    status: 'in_progress',
    priority: 'normal',
    customer: 'Dana Park',
    channel: 'Chat',
    createdAt: '2026-07-16T14:30:00Z',
  },
  {
    id: 'TKT-003',
    subject: 'Billing question about invoice #1042',
    status: 'resolved',
    priority: 'low',
    customer: 'Morgan Tate',
    channel: 'Phone',
    createdAt: '2026-07-15T11:00:00Z',
  },
  {
    id: 'TKT-004',
    subject: 'Integration with accounting platform not syncing',
    status: 'open',
    priority: 'urgent',
    customer: 'Riley Chen',
    channel: 'Email',
    createdAt: '2026-07-17T08:45:00Z',
  },
];
