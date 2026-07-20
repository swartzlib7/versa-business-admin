/**
 * ERD-B catalog stubs (baseline locked 2026-07-20).
 * Definitions only — values live on entity `data` JSON later (User pilot ERD-C).
 * Not yet exposed via HTTP API; import from fixtures for layout-driven UI work.
 */

export type CatalogDataType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'picklist'
  | 'multipicklist'
  | 'lookup'
  | 'email'
  | 'url'
  | 'phone'
  | 'currency';

export interface ValueSet {
  id: string;
  api_name: string;
  label: string;
  description: string;
}

export interface ValueSetItem {
  id: string;
  value_set_id: string;
  api_value: string;
  label: string;
  sort_order: number;
  active: boolean;
}

export interface FieldDefinition {
  id: string;
  object_api_name: string;
  api_name: string;
  label: string;
  data_type: CatalogDataType;
  is_system: boolean;
  is_required: boolean;
  default_value: string | null;
  value_set_api_name: string | null;
  lookup_object_api_name: string | null;
  sort_order: number;
  active: boolean;
}

export interface LayoutDefinition {
  id: string;
  object_api_name: string;
  api_name: string;
  label: string;
  layout_type: 'detail' | 'edit' | 'list';
  version: number;
  body: {
    sections: Array<{
      id: string;
      label: string;
      columns: 1 | 2;
      fields: string[]; // field api_name
    }>;
  };
  is_default: boolean;
}

export const valueSets: ValueSet[] = [
  {
    id: 'vs-user-status',
    api_name: 'user_status',
    label: 'User status',
    description: 'Active lifecycle for User (pilot picklist example)',
  },
  {
    id: 'vs-user-role',
    api_name: 'user_role',
    label: 'User role',
    description: 'RBAC role codes for User',
  },
];

export const valueSetItems: ValueSetItem[] = [
  {
    id: 'vsi-us-active',
    value_set_id: 'vs-user-status',
    api_value: 'active',
    label: 'Active',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-us-inactive',
    value_set_id: 'vs-user-status',
    api_value: 'inactive',
    label: 'Inactive',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-ur-admin',
    value_set_id: 'vs-user-role',
    api_value: 'admin',
    label: 'Admin',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-ur-member',
    value_set_id: 'vs-user-role',
    api_value: 'member',
    label: 'Member',
    sort_order: 20,
    active: true,
  },
];

/** System + sample flexible fields for User pilot object */
export const fieldDefinitions: FieldDefinition[] = [
  {
    id: 'fd-user-email',
    object_api_name: 'user',
    api_name: 'email',
    label: 'Email',
    data_type: 'email',
    is_system: true,
    is_required: true,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 10,
    active: true,
  },
  {
    id: 'fd-user-name',
    object_api_name: 'user',
    api_name: 'name',
    label: 'Display name',
    data_type: 'text',
    is_system: true,
    is_required: true,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 20,
    active: true,
  },
  {
    id: 'fd-user-role',
    object_api_name: 'user',
    api_name: 'role',
    label: 'Role',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'member',
    value_set_api_name: 'user_role',
    lookup_object_api_name: null,
    sort_order: 30,
    active: true,
  },
  {
    id: 'fd-user-type',
    object_api_name: 'user',
    api_name: 'type',
    label: 'Type',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'human',
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 40,
    active: true,
  },
  {
    id: 'fd-user-status',
    object_api_name: 'user',
    api_name: 'status',
    label: 'Status',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'active',
    value_set_api_name: 'user_status',
    lookup_object_api_name: null,
    sort_order: 50,
    active: true,
  },
  {
    id: 'fd-user-department-id',
    object_api_name: 'user',
    api_name: 'department_id',
    label: 'Department',
    data_type: 'lookup',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: 'department',
    sort_order: 60,
    active: true,
  },
  {
    id: 'fd-user-bio',
    object_api_name: 'user',
    api_name: 'bio',
    label: 'Bio',
    data_type: 'long_text',
    is_system: false,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 100,
    active: true,
  },
  {
    id: 'fd-user-title',
    object_api_name: 'user',
    api_name: 'job_title',
    label: 'Job title',
    data_type: 'text',
    is_system: false,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 110,
    active: true,
  },
];

export const layoutDefinitions: LayoutDefinition[] = [
  {
    id: 'lay-user-detail-default',
    object_api_name: 'user',
    api_name: 'user_detail_default',
    label: 'User detail (default)',
    layout_type: 'detail',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-identity',
          label: 'Identity',
          columns: 2,
          fields: ['name', 'email', 'type', 'role', 'status'],
        },
        {
          id: 'sec-org',
          label: 'Organization',
          columns: 2,
          fields: ['department_id'],
        },
        {
          id: 'sec-profile',
          label: 'Profile',
          columns: 1,
          fields: ['job_title', 'bio'],
        },
      ],
    },
  },
  {
    id: 'lay-user-edit-default',
    object_api_name: 'user',
    api_name: 'user_edit_default',
    label: 'User edit (default)',
    layout_type: 'edit',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-identity',
          label: 'Identity',
          columns: 2,
          fields: ['name', 'email', 'type', 'role', 'status'],
        },
        {
          id: 'sec-org',
          label: 'Organization',
          columns: 2,
          fields: ['department_id'],
        },
        {
          id: 'sec-profile',
          label: 'Profile',
          columns: 1,
          fields: ['job_title', 'bio'],
        },
      ],
    },
  },
  {
    id: 'lay-user-list-default',
    object_api_name: 'user',
    api_name: 'user_list_default',
    label: 'User list (default)',
    layout_type: 'list',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-columns',
          label: 'Columns',
          columns: 1,
          fields: ['name', 'email', 'role', 'type', 'status', 'department_id'],
        },
      ],
    },
  },
];

export function getValueSetByApiName(apiName: string): ValueSet | undefined {
  return valueSets.find((v) => v.api_name === apiName);
}

export function listValueSetItems(valueSetId: string): ValueSetItem[] {
  return valueSetItems
    .filter((i) => i.value_set_id === valueSetId && i.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function listFieldDefinitions(objectApiName: string): FieldDefinition[] {
  return fieldDefinitions
    .filter((f) => f.object_api_name === objectApiName && f.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getDefaultLayout(
  objectApiName: string,
  layoutType: LayoutDefinition['layout_type'],
): LayoutDefinition | undefined {
  return layoutDefinitions.find(
    (l) =>
      l.object_api_name === objectApiName &&
      l.layout_type === layoutType &&
      l.is_default,
  );
}
