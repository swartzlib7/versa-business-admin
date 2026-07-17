// Placeholder fixture for the "Other Systems" facet.
// Generic adjacent systems a business might run alongside Mission Control.

export interface OtherSystemFixture {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'standalone' | 'planned';
  description: string;
}

export const otherSystems: OtherSystemFixture[] = [
  {
    id: 'sys-1',
    name: 'Accounting Platform',
    category: 'Finance',
    status: 'connected',
    description: 'General ledger, invoicing, and expense tracking.',
  },
  {
    id: 'sys-2',
    name: 'CRM Pipeline',
    category: 'Sales',
    status: 'connected',
    description: 'Leads, opportunities, and customer relationships.',
  },
  {
    id: 'sys-3',
    name: 'Inventory Manager',
    category: 'Operations',
    status: 'standalone',
    description: 'Stock levels, suppliers, and reorder thresholds.',
  },
  {
    id: 'sys-4',
    name: 'HR Portal',
    category: 'People',
    status: 'planned',
    description: 'Time off, benefits, and employee records.',
  },
];
