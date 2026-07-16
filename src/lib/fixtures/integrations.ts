export interface IntegrationFixture {
  id: string;
  name: string;
  type: 'email' | 'cms' | 'database' | 'api' | 'iot' | 'messaging';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  description: string;
}

export const integrations: IntegrationFixture[] = [
  {
    id: 'int-1',
    name: 'Company email',
    type: 'email',
    status: 'connected',
    lastSync: '2026-07-14T23:00:00Z',
    description: 'Shared inbox for client and support mail',
  },
  {
    id: 'int-2',
    name: 'Knowledge CMS',
    type: 'cms',
    status: 'connected',
    lastSync: '2026-07-14T22:45:00Z',
    description: 'Handbook and process documentation',
  },
  {
    id: 'int-3',
    name: 'Team chat',
    type: 'messaging',
    status: 'connected',
    lastSync: '2026-07-14T23:30:00Z',
    description: 'Internal messaging for delivery teams',
  },
  {
    id: 'int-4',
    name: 'Source control',
    type: 'api',
    status: 'disconnected',
    lastSync: '2026-07-13T10:00:00Z',
    description: 'Code and configuration repositories',
  },
  {
    id: 'int-5',
    name: 'Analytics warehouse',
    type: 'database',
    status: 'error',
    lastSync: '2026-07-14T20:15:00Z',
    description: 'Reporting database for operational metrics',
  },
];
