import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Versa AGi Mission API',
    version: '0.3.0',
    endpoints: {
      health: '/api/health',
      // Public content (no auth)
      publicBusiness: '/api/public/business',
      publicServices: '/api/public/services',
      publicProducts: '/api/public/products',
      publicStaff: '/api/public/staff',
      // Backend (auth required in future)
      agents: '/api/agents (deprecated — use /api/users?type=agent)',
      agentDetail: '/api/agents/{id} (deprecated)',
      projects: '/api/projects',
      integrations: '/api/integrations',
      tasks: '/api/tasks',
    },
  });
}
