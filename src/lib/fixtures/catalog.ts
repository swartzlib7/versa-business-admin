/**
 * ERD-B catalog stubs (baseline locked 2026-07-20) + I5.6.32b agent schema API.
 * Definitions only — values live on entity `data` JSON later (User pilot ERD-C; ERD-D Project/Task/Product).
 * HTTP: GET/POST under /api/catalog (auth). Custom field extensions are session-local on fixtures
 * until Phase 2+ persists catalog tables.
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
  {
    id: 'vs-project-status',
    api_name: 'project_status',
    label: 'Project status',
    description: 'Lifecycle for Project',
  },
  {
    id: 'vs-project-priority',
    api_name: 'project_priority',
    label: 'Project priority',
    description: 'Priority for Project',
  },
  {
    id: 'vs-task-status',
    api_name: 'task_status',
    label: 'Task status',
    description: 'Lifecycle for Task',
  },
  {
    id: 'vs-task-priority',
    api_name: 'task_priority',
    label: 'Task priority',
    description: 'Priority for Task',
  },
  {
    id: 'vs-product-status',
    api_name: 'product_status',
    label: 'Product status',
    description: 'Availability for Product',
  },
  {
    id: 'vs-product-category',
    api_name: 'product_category',
    label: 'Product category',
    description: 'Catalog category for Product',
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
  {
    id: 'vsi-ps-active',
    value_set_id: 'vs-project-status',
    api_value: 'active',
    label: 'Active',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-ps-paused',
    value_set_id: 'vs-project-status',
    api_value: 'paused',
    label: 'Paused',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-ps-completed',
    value_set_id: 'vs-project-status',
    api_value: 'completed',
    label: 'Completed',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-ps-archived',
    value_set_id: 'vs-project-status',
    api_value: 'archived',
    label: 'Archived',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-pp-low',
    value_set_id: 'vs-project-priority',
    api_value: 'low',
    label: 'Low',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-pp-normal',
    value_set_id: 'vs-project-priority',
    api_value: 'normal',
    label: 'Normal',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-pp-high',
    value_set_id: 'vs-project-priority',
    api_value: 'high',
    label: 'High',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-ts-planned',
    value_set_id: 'vs-task-status',
    api_value: 'planned',
    label: 'Planned',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-ts-in_progress',
    value_set_id: 'vs-task-status',
    api_value: 'in_progress',
    label: 'In progress',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-ts-waiting',
    value_set_id: 'vs-task-status',
    api_value: 'waiting',
    label: 'Waiting',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-ts-blocked',
    value_set_id: 'vs-task-status',
    api_value: 'blocked',
    label: 'Blocked',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-ts-done',
    value_set_id: 'vs-task-status',
    api_value: 'done',
    label: 'Done',
    sort_order: 50,
    active: true,
  },
  {
    id: 'vsi-tp-low',
    value_set_id: 'vs-task-priority',
    api_value: 'low',
    label: 'Low',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-tp-normal',
    value_set_id: 'vs-task-priority',
    api_value: 'normal',
    label: 'Normal',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-tp-high',
    value_set_id: 'vs-task-priority',
    api_value: 'high',
    label: 'High',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-tp-urgent',
    value_set_id: 'vs-task-priority',
    api_value: 'urgent',
    label: 'Urgent',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-prs-available',
    value_set_id: 'vs-product-status',
    api_value: 'available',
    label: 'Available',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-prs-beta',
    value_set_id: 'vs-product-status',
    api_value: 'beta',
    label: 'Beta',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-prs-coming',
    value_set_id: 'vs-product-status',
    api_value: 'coming-soon',
    label: 'Coming soon',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-pc-packages',
    value_set_id: 'vs-product-category',
    api_value: 'Packages',
    label: 'Packages',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-pc-platform',
    value_set_id: 'vs-product-category',
    api_value: 'Platform',
    label: 'Platform',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-pc-service',
    value_set_id: 'vs-product-category',
    api_value: 'Service',
    label: 'Service',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-pc-knowledge',
    value_set_id: 'vs-product-category',
    api_value: 'Knowledge',
    label: 'Knowledge',
    sort_order: 40,
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
  // --- Project ---
  {
    id: 'fd-project-name',
    object_api_name: 'project',
    api_name: 'name',
    label: 'Project name',
    data_type: 'text',
    is_system: true,
    is_required: true,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 10,
    active: true,
  },
  {
    id: 'fd-project-status',
    object_api_name: 'project',
    api_name: 'status',
    label: 'Status',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'active',
    value_set_api_name: 'project_status',
    lookup_object_api_name: null,
    sort_order: 20,
    active: true,
  },
  {
    id: 'fd-project-priority',
    object_api_name: 'project',
    api_name: 'priority',
    label: 'Priority',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'normal',
    value_set_api_name: 'project_priority',
    lookup_object_api_name: null,
    sort_order: 30,
    active: true,
  },
  {
    id: 'fd-project-owner',
    object_api_name: 'project',
    api_name: 'owner_name',
    label: 'Owner',
    data_type: 'text',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 40,
    active: true,
  },
  {
    id: 'fd-project-start',
    object_api_name: 'project',
    api_name: 'start_date',
    label: 'Start date',
    data_type: 'date',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 50,
    active: true,
  },
  {
    id: 'fd-project-target',
    object_api_name: 'project',
    api_name: 'target_date',
    label: 'Target date',
    data_type: 'date',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 60,
    active: true,
  },
  {
    id: 'fd-project-task-count',
    object_api_name: 'project',
    api_name: 'task_count',
    label: 'Task count',
    data_type: 'number',
    is_system: true,
    is_required: false,
    default_value: '0',
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 70,
    active: true,
  },
  {
    id: 'fd-project-description',
    object_api_name: 'project',
    api_name: 'description',
    label: 'Description',
    data_type: 'long_text',
    is_system: false,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 100,
    active: true,
  },
  // --- Task ---
  {
    id: 'fd-task-title',
    object_api_name: 'task',
    api_name: 'title',
    label: 'Title',
    data_type: 'text',
    is_system: true,
    is_required: true,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 10,
    active: true,
  },
  {
    id: 'fd-task-status',
    object_api_name: 'task',
    api_name: 'status',
    label: 'Status',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'planned',
    value_set_api_name: 'task_status',
    lookup_object_api_name: null,
    sort_order: 20,
    active: true,
  },
  {
    id: 'fd-task-priority',
    object_api_name: 'task',
    api_name: 'priority',
    label: 'Priority',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'normal',
    value_set_api_name: 'task_priority',
    lookup_object_api_name: null,
    sort_order: 30,
    active: true,
  },
  {
    id: 'fd-task-project',
    object_api_name: 'task',
    api_name: 'project_name',
    label: 'Project',
    data_type: 'text',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 40,
    active: true,
  },
  {
    id: 'fd-task-assignee',
    object_api_name: 'task',
    api_name: 'assignee_name',
    label: 'Assignee',
    data_type: 'text',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 50,
    active: true,
  },
  {
    id: 'fd-task-due',
    object_api_name: 'task',
    api_name: 'due_date',
    label: 'Due date',
    data_type: 'date',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 60,
    active: true,
  },
  {
    id: 'fd-task-description',
    object_api_name: 'task',
    api_name: 'description',
    label: 'Description',
    data_type: 'long_text',
    is_system: false,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 100,
    active: true,
  },
  // --- Product ---
  {
    id: 'fd-product-name',
    object_api_name: 'product',
    api_name: 'name',
    label: 'Product name',
    data_type: 'text',
    is_system: true,
    is_required: true,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 10,
    active: true,
  },
  {
    id: 'fd-product-tagline',
    object_api_name: 'product',
    api_name: 'tagline',
    label: 'Tagline',
    data_type: 'text',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: null,
    sort_order: 20,
    active: true,
  },
  {
    id: 'fd-product-category',
    object_api_name: 'product',
    api_name: 'category',
    label: 'Category',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'Packages',
    value_set_api_name: 'product_category',
    lookup_object_api_name: null,
    sort_order: 30,
    active: true,
  },
  {
    id: 'fd-product-status',
    object_api_name: 'product',
    api_name: 'status',
    label: 'Status',
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: 'available',
    value_set_api_name: 'product_status',
    lookup_object_api_name: null,
    sort_order: 40,
    active: true,
  },
  {
    id: 'fd-product-description',
    object_api_name: 'product',
    api_name: 'description',
    label: 'Description',
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
    id: 'fd-product-features',
    object_api_name: 'product',
    api_name: 'features',
    label: 'Features',
    data_type: 'long_text',
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
  // Project layouts
  {
    id: 'lay-project-detail-default',
    object_api_name: 'project',
    api_name: 'project_detail_default',
    label: 'Project detail (default)',
    layout_type: 'detail',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-core',
          label: 'Core',
          columns: 2,
          fields: ['name', 'status', 'priority', 'owner_name'],
        },
        {
          id: 'sec-schedule',
          label: 'Schedule',
          columns: 2,
          fields: ['start_date', 'target_date', 'task_count'],
        },
        {
          id: 'sec-about',
          label: 'About',
          columns: 1,
          fields: ['description'],
        },
      ],
    },
  },
  {
    id: 'lay-project-edit-default',
    object_api_name: 'project',
    api_name: 'project_edit_default',
    label: 'Project edit (default)',
    layout_type: 'edit',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-core',
          label: 'Core',
          columns: 2,
          fields: ['name', 'status', 'priority', 'owner_name'],
        },
        {
          id: 'sec-schedule',
          label: 'Schedule',
          columns: 2,
          fields: ['start_date', 'target_date', 'task_count'],
        },
        {
          id: 'sec-about',
          label: 'About',
          columns: 1,
          fields: ['description'],
        },
      ],
    },
  },
  {
    id: 'lay-project-list-default',
    object_api_name: 'project',
    api_name: 'project_list_default',
    label: 'Project list (default)',
    layout_type: 'list',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-columns',
          label: 'Columns',
          columns: 1,
          fields: ['name', 'status', 'priority', 'owner_name', 'target_date', 'task_count'],
        },
      ],
    },
  },
  // Task layouts
  {
    id: 'lay-task-detail-default',
    object_api_name: 'task',
    api_name: 'task_detail_default',
    label: 'Task detail (default)',
    layout_type: 'detail',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-core',
          label: 'Core',
          columns: 2,
          fields: ['title', 'status', 'priority', 'project_name', 'assignee_name', 'due_date'],
        },
        {
          id: 'sec-about',
          label: 'About',
          columns: 1,
          fields: ['description'],
        },
      ],
    },
  },
  {
    id: 'lay-task-edit-default',
    object_api_name: 'task',
    api_name: 'task_edit_default',
    label: 'Task edit (default)',
    layout_type: 'edit',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-core',
          label: 'Core',
          columns: 2,
          fields: ['title', 'status', 'priority', 'project_name', 'assignee_name', 'due_date'],
        },
        {
          id: 'sec-about',
          label: 'About',
          columns: 1,
          fields: ['description'],
        },
      ],
    },
  },
  {
    id: 'lay-task-list-default',
    object_api_name: 'task',
    api_name: 'task_list_default',
    label: 'Task list (default)',
    layout_type: 'list',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-columns',
          label: 'Columns',
          columns: 1,
          fields: ['title', 'status', 'priority', 'project_name', 'assignee_name', 'due_date'],
        },
      ],
    },
  },
  // Product layouts
  {
    id: 'lay-product-detail-default',
    object_api_name: 'product',
    api_name: 'product_detail_default',
    label: 'Product detail (default)',
    layout_type: 'detail',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-core',
          label: 'Core',
          columns: 2,
          fields: ['name', 'tagline', 'category', 'status'],
        },
        {
          id: 'sec-about',
          label: 'About',
          columns: 1,
          fields: ['description', 'features'],
        },
      ],
    },
  },
  {
    id: 'lay-product-edit-default',
    object_api_name: 'product',
    api_name: 'product_edit_default',
    label: 'Product edit (default)',
    layout_type: 'edit',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-core',
          label: 'Core',
          columns: 2,
          fields: ['name', 'tagline', 'category', 'status'],
        },
        {
          id: 'sec-about',
          label: 'About',
          columns: 1,
          fields: ['description', 'features'],
        },
      ],
    },
  },
  {
    id: 'lay-product-list-default',
    object_api_name: 'product',
    api_name: 'product_list_default',
    label: 'Product list (default)',
    layout_type: 'list',
    version: 1,
    is_default: true,
    body: {
      sections: [
        {
          id: 'sec-columns',
          label: 'Columns',
          columns: 1,
          fields: ['name', 'tagline', 'category', 'status'],
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Object registry (typed cores + faculty record types) — I5.6.32b
// ---------------------------------------------------------------------------

export type ObjectCoreKind = 'typed_table' | 'faculty_record' | 'catalog_only';

export interface ObjectDefinition {
  api_name: string;
  label: string;
  description: string;
  core_kind: ObjectCoreKind;
  /** REST collection for instance data when typed_table; null for definition-only. */
  instance_collection: string | null;
  extensible: boolean;
  faculty?: string;
}

/** Baseline objects agents can discover. Faculty record types seeded for 32c path. */
export const objectDefinitions: ObjectDefinition[] = [
  {
    api_name: 'user',
    label: 'User',
    description: 'Human or agent identity (agents ARE users with type=agent).',
    core_kind: 'typed_table',
    instance_collection: '/api/users',
    extensible: true,
  },
  {
    api_name: 'project',
    label: 'Project',
    description: 'Strategic/delivery project (first-class table; not generic EAV).',
    core_kind: 'typed_table',
    instance_collection: '/api/projects',
    extensible: true,
  },
  {
    api_name: 'task',
    label: 'Task',
    description: 'Work item under a project (first-class FK to project).',
    core_kind: 'typed_table',
    instance_collection: '/api/tasks',
    extensible: true,
  },
  {
    api_name: 'product',
    label: 'Product',
    description: 'Product offering owned by Production faculty.',
    core_kind: 'typed_table',
    instance_collection: '/api/public/products',
    extensible: true,
  },
  {
    api_name: 'qualification_item',
    label: 'Qualification record',
    description: 'Faculty Records type under Qualification (config-driven path).',
    core_kind: 'faculty_record',
    instance_collection: null,
    extensible: true,
    faculty: 'qualification',
  },
  {
    api_name: 'public_item',
    label: 'Public record',
    description: 'Faculty Records type under Public.',
    core_kind: 'faculty_record',
    instance_collection: null,
    extensible: true,
    faculty: 'public',
  },
  {
    api_name: 'comms_item',
    label: 'Communications record',
    description: 'Faculty Records type under Communications.',
    core_kind: 'faculty_record',
    instance_collection: null,
    extensible: true,
    faculty: 'communications',
  },
  {
    api_name: 'dissemination_item',
    label: 'Dissemination record',
    description: 'Faculty Records type under Dissemination.',
    core_kind: 'faculty_record',
    instance_collection: null,
    extensible: true,
    faculty: 'dissemination',
  },
  {
    api_name: 'treasury_item',
    label: 'Treasury record',
    description: 'Faculty Records type under Treasury.',
    core_kind: 'faculty_record',
    instance_collection: null,
    extensible: true,
    faculty: 'treasury',
  },
];

// Mutable copies for in-process custom field extensions (fixture mode).
let mutableFieldDefinitions: FieldDefinition[] = [...fieldDefinitions];
let mutableValueSets: ValueSet[] = [...valueSets];
let mutableValueSetItems: ValueSetItem[] = [...valueSetItems];
let mutableLayoutDefinitions: LayoutDefinition[] = [...layoutDefinitions];
let mutableObjectDefinitions: ObjectDefinition[] = [...objectDefinitions];

export function resetCatalog(): void {
  mutableFieldDefinitions = [...fieldDefinitions];
  mutableValueSets = [...valueSets];
  mutableValueSetItems = [...valueSetItems];
  mutableLayoutDefinitions = [...layoutDefinitions];
  mutableObjectDefinitions = [...objectDefinitions];
}

export function listObjects(): ObjectDefinition[] {
  return [...mutableObjectDefinitions].sort((a, b) => a.api_name.localeCompare(b.api_name));
}

export function getObject(apiName: string): ObjectDefinition | undefined {
  return mutableObjectDefinitions.find((o) => o.api_name === apiName);
}

export function getValueSetByApiName(apiName: string): ValueSet | undefined {
  return mutableValueSets.find((v) => v.api_name === apiName);
}

export function listValueSetItems(valueSetId: string): ValueSetItem[] {
  return mutableValueSetItems
    .filter((i) => i.value_set_id === valueSetId && i.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function listFieldDefinitions(objectApiName: string): FieldDefinition[] {
  return mutableFieldDefinitions
    .filter((f) => f.object_api_name === objectApiName && f.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getDefaultLayout(
  objectApiName: string,
  layoutType: LayoutDefinition['layout_type'],
): LayoutDefinition | undefined {
  return mutableLayoutDefinitions.find(
    (l) =>
      l.object_api_name === objectApiName &&
      l.layout_type === layoutType &&
      l.is_default,
  );
}

export function listAllFieldDefinitions(objectApiName?: string): FieldDefinition[] {
  let rows = mutableFieldDefinitions.filter((f) => f.active);
  if (objectApiName) rows = rows.filter((f) => f.object_api_name === objectApiName);
  return rows.sort((a, b) => a.sort_order - b.sort_order || a.api_name.localeCompare(b.api_name));
}

export function listAllLayouts(
  objectApiName?: string,
  layoutType?: LayoutDefinition['layout_type'],
): LayoutDefinition[] {
  let rows = [...mutableLayoutDefinitions];
  if (objectApiName) rows = rows.filter((l) => l.object_api_name === objectApiName);
  if (layoutType) rows = rows.filter((l) => l.layout_type === layoutType);
  return rows;
}

export function listAllValueSets(): ValueSet[] {
  return [...mutableValueSets].sort((a, b) => a.api_name.localeCompare(b.api_name));
}

export function getValueSetByApiNameLive(apiName: string): ValueSet | undefined {
  return getValueSetByApiName(apiName);
}

export function listValueSetItemsLive(valueSetId: string): ValueSetItem[] {
  return listValueSetItems(valueSetId);
}

export function getObjectSchema(objectApiName: string) {
  const object = getObject(objectApiName);
  if (!object) return null;
  const fields = listAllFieldDefinitions(objectApiName);
  const layouts = listAllLayouts(objectApiName);
  const valueSetNames = [
    ...new Set(fields.map((f) => f.value_set_api_name).filter(Boolean) as string[]),
  ];
  const value_sets = valueSetNames.map((name) => {
    const vs = getValueSetByApiName(name);
    if (!vs) return { api_name: name, items: [] as ValueSetItem[] };
    return { ...vs, items: listValueSetItems(vs.id) };
  });
  return { object, fields, layouts, value_sets };
}

const ALLOWED_DATA_TYPES: CatalogDataType[] = [
  'text',
  'long_text',
  'number',
  'boolean',
  'date',
  'datetime',
  'picklist',
  'multipicklist',
  'lookup',
  'email',
  'url',
  'phone',
  'currency',
];

export interface ExtendFieldInput {
  object_api_name: string;
  api_name: string;
  label: string;
  data_type: CatalogDataType;
  is_required?: boolean;
  default_value?: string | null;
  value_set_api_name?: string | null;
  lookup_object_api_name?: string | null;
}

export type ExtendFieldResult =
  | { ok: true; field: FieldDefinition }
  | { ok: false; code: string; message: string };

/** Agent/admin extension: add a non-system field definition (fixture-local until DB catalog). */
export function extendFieldDefinition(input: ExtendFieldInput): ExtendFieldResult {
  const object = getObject(input.object_api_name);
  if (!object) {
    return {
      ok: false,
      code: 'UNKNOWN_OBJECT',
      message: `Unknown object_api_name '${input.object_api_name}'. GET /api/catalog/objects for the registry.`,
    };
  }
  if (!object.extensible) {
    return {
      ok: false,
      code: 'NOT_EXTENSIBLE',
      message: `Object '${input.object_api_name}' is not extensible.`,
    };
  }
  const apiName = (input.api_name || '').trim();
  if (!/^[a-z][a-z0-9_]*$/.test(apiName)) {
    return {
      ok: false,
      code: 'INVALID_API_NAME',
      message: 'api_name must be snake_case starting with a letter (e.g. custom_score).',
    };
  }
  if (apiName.startsWith('system_') || apiName === 'id') {
    return {
      ok: false,
      code: 'RESERVED_API_NAME',
      message: 'That api_name is reserved.',
    };
  }
  if (!ALLOWED_DATA_TYPES.includes(input.data_type)) {
    return {
      ok: false,
      code: 'INVALID_DATA_TYPE',
      message: `data_type must be one of: ${ALLOWED_DATA_TYPES.join(', ')}`,
    };
  }
  if (
    (input.data_type === 'picklist' || input.data_type === 'multipicklist') &&
    !input.value_set_api_name
  ) {
    return {
      ok: false,
      code: 'VALUE_SET_REQUIRED',
      message: 'picklist/multipicklist fields require value_set_api_name.',
    };
  }
  if (input.value_set_api_name && !getValueSetByApiName(input.value_set_api_name)) {
    return {
      ok: false,
      code: 'UNKNOWN_VALUE_SET',
      message: `Unknown value_set_api_name '${input.value_set_api_name}'.`,
    };
  }
  if (input.data_type === 'lookup' && !input.lookup_object_api_name) {
    return {
      ok: false,
      code: 'LOOKUP_REQUIRED',
      message: 'lookup fields require lookup_object_api_name.',
    };
  }
  if (input.lookup_object_api_name && !getObject(input.lookup_object_api_name)) {
    return {
      ok: false,
      code: 'UNKNOWN_LOOKUP_OBJECT',
      message: `Unknown lookup_object_api_name '${input.lookup_object_api_name}'.`,
    };
  }
  const exists = mutableFieldDefinitions.some(
    (f) => f.object_api_name === input.object_api_name && f.api_name === apiName,
  );
  if (exists) {
    return {
      ok: false,
      code: 'FIELD_EXISTS',
      message: `Field '${apiName}' already exists on '${input.object_api_name}'.`,
    };
  }
  const siblings = mutableFieldDefinitions.filter((f) => f.object_api_name === input.object_api_name);
  const nextOrder = siblings.reduce((m, f) => Math.max(m, f.sort_order), 0) + 10;
  const field: FieldDefinition = {
    id: `fld-ext-${input.object_api_name}-${apiName}`,
    object_api_name: input.object_api_name,
    api_name: apiName,
    label: (input.label || apiName).trim(),
    data_type: input.data_type,
    is_system: false,
    is_required: Boolean(input.is_required),
    default_value: input.default_value ?? null,
    value_set_api_name: input.value_set_api_name ?? null,
    lookup_object_api_name: input.lookup_object_api_name ?? null,
    sort_order: nextOrder,
    active: true,
  };
  mutableFieldDefinitions.push(field);
  return { ok: true, field };
}
