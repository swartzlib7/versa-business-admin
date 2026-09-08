import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { listObjects } from '@/lib/fixtures/catalog';
import pkg from '../../../../package.json';
import { API_DOCS } from '@/lib/api/inventory';

/**
 * GET /api/catalog — schema index for agents and UI.
 * I5.6.32b: discoverable object/field/layout catalog.
 */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const objects = listObjects();
  return NextResponse.json({
    name: 'Versa - Business Admin object catalog',
    version: pkg.version,
    docs: {
      operator: API_DOCS.operator,
      index: '/api',
      contract: API_DOCS.contract,
    },
    description:
      'Read object schema (fields, layouts, value sets, record types). Extend with custom fields via POST /api/catalog/fields. Typed cores (project/task/product/user) stay first-class tables; faculty_* are config-driven record types.',
    endpoints: {
      index: 'GET /api/catalog',
      objects: 'GET /api/catalog/objects',
      objectDetail: 'GET /api/catalog/objects/{object_api_name}',
      fields: 'GET /api/catalog/fields?object={object_api_name}',
      extendField: 'POST /api/catalog/fields',
      layouts: 'GET /api/catalog/layouts?object={object_api_name}&type=detail|edit|list',
      valueSets: 'GET /api/catalog/value-sets',
      valueSetDetail: 'GET /api/catalog/value-sets/{api_name}',
      recordTypes: 'GET /api/catalog/record-types',
      recordTypeDetail: 'GET /api/catalog/record-types/{api_name}',
      productIndex: 'GET /api',
    },
    extension: {
      method: 'POST /api/catalog/fields',
      body: {
        object_api_name: 'project',
        api_name: 'c_score',
        label: 'Custom score',
        data_type: 'number',
        is_required: false,
        default_value: null,
        value_set_api_name: null,
        lookup_object_api_name: null,
      },
      notes: [
        'Custom api_name must start with c_ plus lowercase letters, digits, and underscores (D1). System names stay unprefixed.',
        'Custom fields are is_system=false.',
        'Custom fields, layouts, and value sets persist via the durable catalog overlay (survives restart).',
        'Does not create DB columns; values intended for entity data JSONB.',
        'Cannot collapse project/task into generic EAV — use faculty record types for free-form lists.',
      ],
    },
    objects,
    count: objects.length,
  });
}
