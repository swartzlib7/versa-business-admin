import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Versa Admin System API',
    version: '0.2.0',
    endpoints: {
      health: '/api/health',
      agents: '/api/agents',
      projects: '/api/projects',
      integrations: '/api/integrations',
      tasks: '/api/tasks',
    },
  });
}
