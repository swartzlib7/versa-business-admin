import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Business Workspace API',
    version: '0.7.46',
    endpoints: {
      health: '/api/health',
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      session: '/api/auth/session',
      catalog: '/api/catalog',
      catalogObjects: '/api/catalog/objects',
      catalogObjectDetail: '/api/catalog/objects/{object_api_name}',
      catalogFields: '/api/catalog/fields',
      catalogExtendField: 'POST /api/catalog/fields',
      catalogLayouts: '/api/catalog/layouts',
      catalogValueSets: '/api/catalog/value-sets',
      publicBusiness: '/api/public/business',
      publicServices: '/api/public/services',
      publicProducts: '/api/public/products',
      publicStaff: '/api/public/staff',
      users: '/api/users',
      userDetail: '/api/users/{id}',
      agents: '/api/agents (deprecated — use /api/users?type=agent)',
      agentDetail: '/api/agents/{id} (deprecated)',
      projects: '/api/projects',
      projectDetail: '/api/projects/{id}',
      tasks: '/api/tasks',
      taskDetail: '/api/tasks/{id}',
      integrations: '/api/integrations',
    },
  });
}
