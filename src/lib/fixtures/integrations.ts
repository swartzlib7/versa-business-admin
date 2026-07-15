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
    name: 'Gmail IMAP',
    type: 'email',
    status: 'connected',
    lastSync: '2026-07-14T23:00:00Z',
    description: 'Primary email monitoring via IMAP',
  },
  {
    id: 'int-2',
    name: 'Grav CMS',
    type: 'cms',
    status: 'connected',
    lastSync: '2026-07-14T22:45:00Z',
    description: 'Knowledge base content management',
  },
  {
    id: 'int-3',
    name: 'VersaVoice API',
    type: 'messaging',
    status: 'connected',
    lastSync: '2026-07-14T23:30:00Z',
    description: 'Voice and messaging platform',
  },
  {
    id: 'int-4',
    name: 'GitLab CI',
    type: 'api',
    status: 'disconnected',
    lastSync: '2026-07-13T10:00:00Z',
    description: 'Source control and CI/CD pipelines',
  },
  {
    id: 'int-5',
    name: 'AWS IoT Core',
    type: 'iot',
    status: 'error',
    lastSync: '2026-07-14T20:15:00Z',
    description: 'IoT device management for mysmartyard',
  },
];
