/**
 * ERD-B catalog stubs (baseline locked 2026-07-20) + I5.6.32b agent schema API.
 * Definitions only — values live on entity `data` JSON later (User pilot ERD-C; ERD-D Project/Task/Product).
 * HTTP: GET/POST under /api/catalog (auth). Custom fields, layouts, and value sets
 * persist through the durable catalog overlay (seed ∪ overlay).
 */
import { listInstances } from './record-instances';
import { validateTenantApiName } from '@/lib/catalog/custom-namespace';

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
  | 'currency'
  | 'file';

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
  /** Slice F (rev E section 4.2 lookup_field, C2): delete rule for lookup
   *  fields. NULL reads as the locked default 'orphan' (plain lookup);
   *  'cascade' (master-detail) is opt-in per field. */
  lookup_delete_rule?: 'cascade' | 'orphan' | null;
  sort_order: number;
  active: boolean;
  /** J4: header_lines placement - header | list (null = default). */
  zone_role?: 'header' | 'list' | null;
  /** O1: explicit lines-table column flag (header_lines list-zone fields). */
  show_in_column?: boolean;
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
  {
    id: 'vs-faculty-status',
    api_name: 'faculty_status',
    label: 'Faculty status',
    description: 'Status for organization faculty',
  },
  {
    id: 'vs-policy-scope',
    api_name: 'policy_scope',
    label: 'Policy scope',
    description: 'Scope of policy application',
  },
  {
    id: 'vs-zone-project-status',
    api_name: 'zone_project_status',
    label: 'Zone project status',
    description: 'Status for projects in zone views',
  },
  {
    id: 'vs-zone-task-status',
    api_name: 'zone_task_status',
    label: 'Zone task status',
    description: 'Status for tasks in zone views',
  },
  {
    id: 'vs-service-status',
    api_name: 'service_status',
    label: 'Service status',
    description: 'Status for Service records',
  },
  {
    id: 'vs-vendor-category',
    api_name: 'vendor_category',
    label: 'Vendor category',
    description: 'Category of vendor',
  },
  {
    id: 'vs-vendor-status',
    api_name: 'vendor_status',
    label: 'Vendor status',
    description: 'Status for Vendor records',
  },
  {
    id: 'vs-integration-kind',
    api_name: 'integration_kind',
    label: 'Integration kind',
    description: 'Kind of integration',
  },
  {
    id: 'vs-integration-status',
    api_name: 'integration_status',
    label: 'Integration status',
    description: 'Status for Integration records',
  },
  {
    id: 'vs-customer-kind',
    api_name: 'customer_kind',
    label: 'Customer kind',
    description: 'Kind of customer',
  },
  {
    id: 'vs-partner-kind',
    api_name: 'partner_kind',
    label: 'Partner kind',
    description: 'Kind of partner',
  },
  {
    id: 'vs-event-kind',
    api_name: 'event_kind',
    label: 'Event kind',
    description: 'Kind of event',
  },
  {
    id: 'vs-schedule-kind',
    api_name: 'schedule_kind',
    label: 'Schedule kind',
    description: 'Kind of schedule',
  },
  {
    id: 'vs-knowledge-kind',
    api_name: 'knowledge_kind',
    label: 'Knowledge kind',
    description: 'Kind of knowledge asset',
  },
  {
    id: 'vs-stat-scale',
    api_name: 'stat_scale',
    label: 'Stat scale',
    description: 'Reporting time scale for an Environment stat',
  },
  {
    id: 'vs-record-status',
    api_name: 'record_status',
    label: 'Record status',
    description: 'Generic status for faculty record types',
  },

  // #246 Slice C (rev E section 3, 2026-08-31): value sets for the new system
  // record types. message_type types Communications messages;
  // treasury_transaction_classification classifies Treasury transactions as
  // income | disbursement (rev E section 3.3); contact_kind carries the rev D
  // Distribution note (staff-type contacts belong to an organization,
  // public-type do not).
  {
    id: 'vs-message-type',
    api_name: 'message_type',
    label: 'Message type',
    description: 'Type of communication message',
  },
  {
    id: 'vs-treasury-transaction-classification',
    api_name: 'treasury_transaction_classification',
    label: 'Treasury transaction classification',
    description: 'Classification of treasury transactions: income | disbursement',
  },
  {
    id: 'vs-contact-kind',
    api_name: 'contact_kind',
    label: 'Contact kind',
    description: 'Staff-type contacts belong to an organization; public-type do not',
  },
  {
    id: 'vs-org-type',
    api_name: 'org_type',
    label: 'Organization type',
    description: 'Primary Org is internal. Collaboration parties are vendor, customer, partner, or branch.',
  },
  {
    id: 'vs-staff-role',
    api_name: 'staff_role',
    label: 'Staff role',
    description: 'Role of a communication_staff record.',
  },
  {
    id: 'vs-policy-status',
    api_name: 'policy_status',
    label: 'Policy status',
    description: 'Draft, active, or archived policy.',
  },
  {
    id: 'vs-document-kind',
    api_name: 'document_kind',
    label: 'Transaction document kind',
    description: 'treasury_transaction is the transaction table. Kinds: transaction, quote, estimate, invoice.',
  },
  {
    id: 'vs-interval-unit',
    api_name: 'interval_unit',
    label: 'Interval unit',
    description: 'Unit for schedule recurrence (paired with interval_count).',
  },
  {
    id: 'vs-file-mime',
    api_name: 'file_mime',
    label: 'File MIME type',
    description: 'Extendable MIME list for catalog data_type=file.',
  },
  {
    id: 'vs-credential-auth-type',
    api_name: 'credential_auth_type',
    label: 'Credential auth type',
    description: 'How a vendor credential authenticates.',
  },
  {
    id: 'vs-exchange-origin',
    api_name: 'exchange_origin',
    label: 'Exchange origin',
    description: 'Inbound or outbound integration I/O.',
  },
  {
    id: 'vs-exchange-status',
    api_name: 'exchange_status',
    label: 'Exchange status',
    description: 'Status of an integration exchange row.',
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
    api_value: 'device',
    label: 'Device',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-pk-manufactured',
    value_set_id: 'vs-product-category',
    api_value: 'manufactured',
    label: 'Manufactured',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-pc-service',
    value_set_id: 'vs-product-category',
    api_value: 'software',
    label: 'Software',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-pc-knowledge',
    value_set_id: 'vs-product-category',
    api_value: 'file',
    label: 'File',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-new-1',
    value_set_id: 'vs-faculty-status',
    api_value: 'active',
    label: 'Active',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-2',
    value_set_id: 'vs-faculty-status',
    api_value: 'standby',
    label: 'Standby',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-3',
    value_set_id: 'vs-faculty-status',
    api_value: 'connected',
    label: 'Connected',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-4',
    value_set_id: 'vs-policy-scope',
    api_value: 'organization',
    label: 'Organization',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-5',
    value_set_id: 'vs-policy-scope',
    api_value: 'department',
    label: 'Department',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-6',
    value_set_id: 'vs-policy-scope',
    api_value: 'product',
    label: 'Product',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-7',
    value_set_id: 'vs-policy-scope',
    api_value: 'compliance',
    label: 'Compliance',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-new-8',
    value_set_id: 'vs-zone-project-status',
    api_value: 'planned',
    label: 'Planned',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-9',
    value_set_id: 'vs-zone-project-status',
    api_value: 'active',
    label: 'Active',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-10',
    value_set_id: 'vs-zone-project-status',
    api_value: 'blocked',
    label: 'Blocked',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-11',
    value_set_id: 'vs-zone-project-status',
    api_value: 'done',
    label: 'Done',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-new-12',
    value_set_id: 'vs-zone-task-status',
    api_value: 'todo',
    label: 'To do',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-13',
    value_set_id: 'vs-zone-task-status',
    api_value: 'in_progress',
    label: 'In progress',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-14',
    value_set_id: 'vs-zone-task-status',
    api_value: 'waiting',
    label: 'Waiting',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-15',
    value_set_id: 'vs-zone-task-status',
    api_value: 'done',
    label: 'Done',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-new-16',
    value_set_id: 'vs-service-status',
    api_value: 'connected',
    label: 'Connected',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-17',
    value_set_id: 'vs-service-status',
    api_value: 'active',
    label: 'Active',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-18',
    value_set_id: 'vs-service-status',
    api_value: 'standby',
    label: 'Standby',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-19',
    value_set_id: 'vs-vendor-category',
    api_value: 'Cloud / CDN',
    label: 'Cloud / CDN',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-20',
    value_set_id: 'vs-vendor-category',
    api_value: 'Cloud / infra',
    label: 'Cloud / infra',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-21',
    value_set_id: 'vs-vendor-category',
    api_value: 'Materials',
    label: 'Materials',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-22',
    value_set_id: 'vs-vendor-status',
    api_value: 'connected',
    label: 'Connected',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-23',
    value_set_id: 'vs-vendor-status',
    api_value: 'active',
    label: 'Active',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-24',
    value_set_id: 'vs-vendor-status',
    api_value: 'standby',
    label: 'Standby',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-25',
    value_set_id: 'vs-integration-kind',
    api_value: 'api',
    label: 'API',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-26',
    value_set_id: 'vs-integration-kind',
    api_value: 'webhook',
    label: 'Webhook',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-27',
    value_set_id: 'vs-integration-kind',
    api_value: 'sftp',
    label: 'SFTP',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-28',
    value_set_id: 'vs-integration-kind',
    api_value: 'manual',
    label: 'Manual',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-new-29',
    value_set_id: 'vs-integration-kind',
    api_value: 'other',
    label: 'Other',
    sort_order: 50,
    active: true,
  },
  {
    id: 'vsi-new-30',
    value_set_id: 'vs-integration-status',
    api_value: 'connected',
    label: 'Connected',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-31',
    value_set_id: 'vs-integration-status',
    api_value: 'active',
    label: 'Active',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-32',
    value_set_id: 'vs-integration-status',
    api_value: 'standby',
    label: 'Standby',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-33',
    value_set_id: 'vs-integration-status',
    api_value: 'error',
    label: 'Error',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-new-34',
    value_set_id: 'vs-customer-kind',
    api_value: 'person',
    label: 'Person',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-35',
    value_set_id: 'vs-customer-kind',
    api_value: 'business',
    label: 'Business',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-36',
    value_set_id: 'vs-partner-kind',
    api_value: 'business',
    label: 'Business',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-37',
    value_set_id: 'vs-partner-kind',
    api_value: 'investor',
    label: 'Investor',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-new-38',
    value_set_id: 'vs-partner-kind',
    api_value: 'association',
    label: 'Association',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-new-39',
    value_set_id: 'vs-event-kind',
    api_value: 'meeting',
    label: 'Meeting',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-40',
    value_set_id: 'vs-event-kind',
    api_value: 'launch',
    label: 'Launch',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-ek-maintenance',
    value_set_id: 'vs-event-kind',
    api_value: 'maintenance',
    label: 'Maintenance',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-ek-other',
    value_set_id: 'vs-event-kind',
    api_value: 'other',
    label: 'Other',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-new-41',
    value_set_id: 'vs-schedule-kind',
    api_value: 'recurring',
    label: 'Recurring',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-new-42',
    value_set_id: 'vs-schedule-kind',
    api_value: 'one-time',
    label: 'One-time',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-kk-document',
    value_set_id: 'vs-knowledge-kind',
    api_value: 'document',
    label: 'Document',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-kk-recording',
    value_set_id: 'vs-knowledge-kind',
    api_value: 'recording',
    label: 'Recording',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-kk-photo',
    value_set_id: 'vs-knowledge-kind',
    api_value: 'photo',
    label: 'Photo',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-kk-policy',
    value_set_id: 'vs-knowledge-kind',
    api_value: 'policy',
    label: 'Policy',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-kk-research',
    value_set_id: 'vs-knowledge-kind',
    api_value: 'research',
    label: 'Research',
    sort_order: 50,
    active: true,
  },
  {
    id: 'vsi-ss-hour',
    value_set_id: 'vs-stat-scale',
    api_value: 'hour',
    label: 'Hour',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-ss-day',
    value_set_id: 'vs-stat-scale',
    api_value: 'day',
    label: 'Day',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-ss-week',
    value_set_id: 'vs-stat-scale',
    api_value: 'week',
    label: 'Week',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-ss-month',
    value_set_id: 'vs-stat-scale',
    api_value: 'month',
    label: 'Month',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-ss-year',
    value_set_id: 'vs-stat-scale',
    api_value: 'year',
    label: 'Year',
    sort_order: 50,
    active: true,
  },
  {
    id: 'vsi-ss-custom',
    value_set_id: 'vs-stat-scale',
    api_value: 'custom',
    label: 'Custom',
    sort_order: 60,
    active: true,
  },
  {
    id: 'vsi-rs-active',
    value_set_id: 'vs-record-status',
    api_value: 'active',
    label: 'Active',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-rs-archived',
    value_set_id: 'vs-record-status',
    api_value: 'archived',
    label: 'Archived',
    sort_order: 20,
    active: true,
  },

  // #246 Slice C: items for message_type, treasury_transaction_classification
  // and contact_kind.
  {
    id: 'vsi-mt-email',
    value_set_id: 'vs-message-type',
    api_value: 'email',
    label: 'Email',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-mt-call',
    value_set_id: 'vs-message-type',
    api_value: 'call',
    label: 'Call',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-mt-meeting',
    value_set_id: 'vs-message-type',
    api_value: 'meeting',
    label: 'Meeting',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-mt-letter',
    value_set_id: 'vs-message-type',
    api_value: 'letter',
    label: 'Letter',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-mt-social',
    value_set_id: 'vs-message-type',
    api_value: 'social',
    label: 'Social',
    sort_order: 50,
    active: true,
  },
  {
    id: 'vsi-ttc-income',
    value_set_id: 'vs-treasury-transaction-classification',
    api_value: 'income',
    label: 'Income',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-ttc-disbursement',
    value_set_id: 'vs-treasury-transaction-classification',
    api_value: 'disbursement',
    label: 'Disbursement',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-ck-staff',
    value_set_id: 'vs-contact-kind',
    api_value: 'staff',
    label: 'Staff',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-ck-public',
    value_set_id: 'vs-contact-kind',
    api_value: 'public',
    label: 'Public',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-ot-internal',
    value_set_id: 'vs-org-type',
    api_value: 'internal',
    label: 'Org',
    sort_order: 10,
    active: true,
  },
  {
    id: 'vsi-ot-vendor',
    value_set_id: 'vs-org-type',
    api_value: 'vendor',
    label: 'Vendor',
    sort_order: 20,
    active: true,
  },
  {
    id: 'vsi-ot-customer',
    value_set_id: 'vs-org-type',
    api_value: 'customer',
    label: 'Customer',
    sort_order: 30,
    active: true,
  },
  {
    id: 'vsi-ot-partner',
    value_set_id: 'vs-org-type',
    api_value: 'partner',
    label: 'Partner',
    sort_order: 40,
    active: true,
  },
  {
    id: 'vsi-ot-branch',
    value_set_id: 'vs-org-type',
    api_value: 'branch',
    label: 'Branch',
    sort_order: 50,
    active: true,
  },
  { id: 'vsi-sr-executive', value_set_id: 'vs-staff-role', api_value: 'executive', label: 'Executive', sort_order: 10, active: true },
  { id: 'vsi-sr-operations', value_set_id: 'vs-staff-role', api_value: 'operations', label: 'Operations', sort_order: 20, active: true },
  { id: 'vsi-sr-finance', value_set_id: 'vs-staff-role', api_value: 'finance', label: 'Finance', sort_order: 30, active: true },
  { id: 'vsi-sr-production', value_set_id: 'vs-staff-role', api_value: 'production', label: 'Production', sort_order: 40, active: true },
  { id: 'vsi-sr-communications', value_set_id: 'vs-staff-role', api_value: 'communications', label: 'Communications', sort_order: 50, active: true },
  { id: 'vsi-sr-sales', value_set_id: 'vs-staff-role', api_value: 'sales', label: 'Sales', sort_order: 60, active: true },
  { id: 'vsi-sr-support', value_set_id: 'vs-staff-role', api_value: 'support', label: 'Support', sort_order: 70, active: true },
  { id: 'vsi-sr-other', value_set_id: 'vs-staff-role', api_value: 'other', label: 'Other', sort_order: 80, active: true },
  { id: 'vsi-polstat-draft', value_set_id: 'vs-policy-status', api_value: 'draft', label: 'Draft', sort_order: 10, active: true },
  { id: 'vsi-polstat-active', value_set_id: 'vs-policy-status', api_value: 'active', label: 'Active', sort_order: 20, active: true },
  { id: 'vsi-polstat-archived', value_set_id: 'vs-policy-status', api_value: 'archived', label: 'Archived', sort_order: 30, active: true },
  { id: 'vsi-dk-transaction', value_set_id: 'vs-document-kind', api_value: 'transaction', label: 'Transaction', sort_order: 10, active: true },
  { id: 'vsi-dk-quote', value_set_id: 'vs-document-kind', api_value: 'quote', label: 'Quote', sort_order: 20, active: true },
  { id: 'vsi-dk-estimate', value_set_id: 'vs-document-kind', api_value: 'estimate', label: 'Estimate', sort_order: 30, active: true },
  { id: 'vsi-dk-invoice', value_set_id: 'vs-document-kind', api_value: 'invoice', label: 'Invoice', sort_order: 40, active: true },
  { id: 'vsi-iu-minute', value_set_id: 'vs-interval-unit', api_value: 'minute', label: 'Minutes', sort_order: 10, active: true },
  { id: 'vsi-iu-hour', value_set_id: 'vs-interval-unit', api_value: 'hour', label: 'Hours', sort_order: 20, active: true },
  { id: 'vsi-iu-day', value_set_id: 'vs-interval-unit', api_value: 'day', label: 'Days', sort_order: 30, active: true },
  { id: 'vsi-iu-week', value_set_id: 'vs-interval-unit', api_value: 'week', label: 'Weeks', sort_order: 40, active: true },
  { id: 'vsi-iu-month', value_set_id: 'vs-interval-unit', api_value: 'month', label: 'Months', sort_order: 50, active: true },
  { id: 'vsi-iu-year', value_set_id: 'vs-interval-unit', api_value: 'year', label: 'Years', sort_order: 60, active: true },
  { id: 'vsi-fm-pdf', value_set_id: 'vs-file-mime', api_value: 'application/pdf', label: 'PDF', sort_order: 10, active: true },
  { id: 'vsi-fm-png', value_set_id: 'vs-file-mime', api_value: 'image/png', label: 'PNG', sort_order: 20, active: true },
  { id: 'vsi-fm-jpeg', value_set_id: 'vs-file-mime', api_value: 'image/jpeg', label: 'JPEG', sort_order: 30, active: true },
  { id: 'vsi-fm-webp', value_set_id: 'vs-file-mime', api_value: 'image/webp', label: 'WebP', sort_order: 40, active: true },
  { id: 'vsi-fm-gif', value_set_id: 'vs-file-mime', api_value: 'image/gif', label: 'GIF', sort_order: 50, active: true },
  { id: 'vsi-fm-plain', value_set_id: 'vs-file-mime', api_value: 'text/plain', label: 'Plain text', sort_order: 60, active: true },
  { id: 'vsi-fm-csv', value_set_id: 'vs-file-mime', api_value: 'text/csv', label: 'CSV', sort_order: 70, active: true },
  { id: 'vsi-fm-json', value_set_id: 'vs-file-mime', api_value: 'application/json', label: 'JSON', sort_order: 80, active: true },
  { id: 'vsi-fm-zip', value_set_id: 'vs-file-mime', api_value: 'application/zip', label: 'ZIP', sort_order: 90, active: true },
  { id: 'vsi-cat-apikey', value_set_id: 'vs-credential-auth-type', api_value: 'api_key', label: 'API key', sort_order: 10, active: true },
  { id: 'vsi-cat-oauth2', value_set_id: 'vs-credential-auth-type', api_value: 'oauth2', label: 'OAuth 2', sort_order: 20, active: true },
  { id: 'vsi-cat-basic', value_set_id: 'vs-credential-auth-type', api_value: 'basic', label: 'Basic', sort_order: 30, active: true },
  { id: 'vsi-cat-smtp', value_set_id: 'vs-credential-auth-type', api_value: 'smtp', label: 'SMTP', sort_order: 40, active: true },
  { id: 'vsi-cat-custom', value_set_id: 'vs-credential-auth-type', api_value: 'custom', label: 'Custom', sort_order: 50, active: true },
  { id: 'vsi-eo-in', value_set_id: 'vs-exchange-origin', api_value: 'inbound', label: 'Inbound', sort_order: 10, active: true },
  { id: 'vsi-eo-out', value_set_id: 'vs-exchange-origin', api_value: 'outbound', label: 'Outbound', sort_order: 20, active: true },
  { id: 'vsi-es-pending', value_set_id: 'vs-exchange-status', api_value: 'pending', label: 'Pending', sort_order: 10, active: true },
  { id: 'vsi-es-ok', value_set_id: 'vs-exchange-status', api_value: 'ok', label: 'OK', sort_order: 20, active: true },
  { id: 'vsi-es-error', value_set_id: 'vs-exchange-status', api_value: 'error', label: 'Error', sort_order: 30, active: true },
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
    id: 'fd-user-created-by',
    object_api_name: 'user',
    api_name: 'created_by',
    label: 'Created by',
    data_type: 'lookup',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: 'user',
    sort_order: 9000,
    active: true,
  },
  {
    id: 'fd-user-last-modified-by',
    object_api_name: 'user',
    api_name: 'last_modified_by',
    label: 'Last modified by',
    data_type: 'lookup',
    is_system: true,
    is_required: false,
    default_value: null,
    value_set_api_name: null,
    lookup_object_api_name: 'user',
    sort_order: 9010,
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
    api_name: "category",
    label: "Category",
    data_type: 'picklist',
    is_system: true,
    is_required: true,
    default_value: "Packages",
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
          fields: ['name', 'tagline', 'kind', 'status'],
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
          fields: ['name', 'tagline', 'kind', 'status'],
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
          fields: ['name', 'tagline', 'kind', 'status'],
        },
      ],
    },
  },
];


// Faculty / dynamic record baseline fields (I5.6.32 Slice 2.1 #220)
// Unspec seed types removed - fields are created with record types via editor/API.
//
// #218 Zone Pages Live Dynamic Records (COA-locked slice, 2026-08-30):
// fields for the 6 system record types backing the baked-in zone listing tabs.
// Picklist fields wire to existing value sets (policy_scope, zone_project_status,
// zone_task_status, product_category, service_status, integration_kind,
// integration_status). executive_policy is header_lines: header-placed fields
// render in the saveable header form; list-placed fields with show_in_column
// render as lines-table columns (O1 semantics).
// executive_policy and production_product carry explicit text 'status' fields
// (no value set exists for them among the locked 7): ensureObjectForRecordType
// auto-seeds name/status on every registered object, so stating them here keeps
// the seed deterministic instead of relying on runtime mutation.
const facultyRecordFieldSeedBase: FieldDefinition[] = [
  { id: 'fld-executive_policy-name', object_api_name: 'executive_policy', api_name: 'name', label: 'Policy title', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true, zone_role: 'header' },
  { id: 'fld-executive_policy-scope', object_api_name: 'executive_policy', api_name: 'scope', label: 'Scope', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'policy_scope', lookup_object_api_name: null, sort_order: 20, active: false, zone_role: 'header' },
  { id: 'fld-executive_policy-owner', object_api_name: 'executive_policy', api_name: 'owner', label: 'Owner (text)', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: false, zone_role: 'header' },
  { id: 'fld-executive_policy-owner_id', object_api_name: 'executive_policy', api_name: 'owner_id', label: 'Owner', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'communication_staff', sort_order: 31, active: true, zone_role: 'header' },
  { id: 'fld-executive_policy-summary', object_api_name: 'executive_policy', api_name: 'summary', label: 'Summary', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: false, zone_role: 'header' },
  { id: 'fld-executive_policy-line_title', object_api_name: 'executive_policy', api_name: 'line_title', label: 'Line title', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: false, zone_role: 'list', show_in_column: true },
  { id: 'fld-executive_policy-title', object_api_name: 'executive_policy', api_name: 'title', label: 'Title', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 51, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-executive_policy-status', object_api_name: 'executive_policy', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: 'draft', value_set_api_name: 'policy_status', lookup_object_api_name: null, sort_order: 70, active: true, zone_role: 'header' },
  { id: 'fld-executive_policy-line_notes', object_api_name: 'executive_policy', api_name: 'line_notes', label: 'Line notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: false, zone_role: 'list', show_in_column: true },
  { id: 'fld-executive_policy-body', object_api_name: 'executive_policy', api_name: 'body', label: 'Body', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 61, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-executive_policy-render_as_html', object_api_name: 'executive_policy', api_name: 'render_as_html', label: 'Render as HTML', data_type: 'boolean', is_system: true, is_required: false, default_value: 'false', value_set_api_name: null, lookup_object_api_name: null, sort_order: 62, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-executive_project-name', object_api_name: 'executive_project', api_name: 'name', label: 'Project name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true , zone_role: 'header' },
  { id: 'fld-executive_project-status', object_api_name: 'executive_project', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'zone_project_status', lookup_object_api_name: null, sort_order: 20, active: true , zone_role: 'header' },
  { id: 'fld-executive_project-owner', object_api_name: 'executive_project', api_name: 'owner', label: 'Owner (text)', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: false, zone_role: 'header' },
  { id: 'fld-executive_project-owner_id', object_api_name: 'executive_project', api_name: 'owner_id', label: 'Owner', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'communication_staff', sort_order: 31, active: true, zone_role: 'header' },
  { id: 'fld-executive_project-priority', object_api_name: 'executive_project', api_name: 'priority', label: 'Priority', data_type: 'picklist', is_system: true, is_required: false, default_value: 'normal', value_set_api_name: 'project_priority', lookup_object_api_name: null, sort_order: 25, active: true, zone_role: 'header' },
  { id: 'fld-executive_project-start_date', object_api_name: 'executive_project', api_name: 'start_date', label: 'Start date', data_type: 'date', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 35, active: true, zone_role: 'header' },
  { id: 'fld-executive_project-target_date', object_api_name: 'executive_project', api_name: 'target_date', label: 'Target date', data_type: 'date', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 36, active: true, zone_role: 'header' },
  { id: 'fld-executive_project-description', object_api_name: 'executive_project', api_name: 'description', label: 'Description', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true , zone_role: 'header' },
  { id: 'fld-executive_project-external_id', object_api_name: 'executive_project', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 45, active: true, zone_role: 'header' },
  { id: 'fld-executive_task-name', object_api_name: 'executive_task', api_name: 'name', label: 'Task title', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true , zone_role: 'header' },
  { id: 'fld-executive_task-status', object_api_name: 'executive_task', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'zone_task_status', lookup_object_api_name: null, sort_order: 20, active: true , zone_role: 'header' },
  { id: 'fld-executive_task-assignee', object_api_name: 'executive_task', api_name: 'assignee', label: 'Assignee (text)', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: false, zone_role: 'header' },
  { id: 'fld-executive_task-assignee_id', object_api_name: 'executive_task', api_name: 'assignee_id', label: 'Assignee', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'communication_staff', sort_order: 31, active: true, zone_role: 'header' },
  { id: 'fld-executive_task-priority', object_api_name: 'executive_task', api_name: 'priority', label: 'Priority', data_type: 'picklist', is_system: true, is_required: false, default_value: 'normal', value_set_api_name: 'task_priority', lookup_object_api_name: null, sort_order: 25, active: true, zone_role: 'header' },
  { id: 'fld-executive_task-due_date', object_api_name: 'executive_task', api_name: 'due_date', label: 'Due date', data_type: 'date', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 35, active: true, zone_role: 'header' },
  { id: 'fld-executive_task-notes', object_api_name: 'executive_task', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true , zone_role: 'header' },
  { id: 'fld-production_product-name', object_api_name: 'production_product', api_name: 'name', label: 'Name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true , zone_role: 'header' },
  { id: 'fld-production_product-tagline', object_api_name: 'production_product', api_name: 'tagline', label: 'Tagline', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 15, active: true, zone_role: 'header' },
  { id: 'fld-production_product-category', object_api_name: 'production_product', api_name: 'category', label: 'Category', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'product_category', lookup_object_api_name: null, sort_order: 20, active: true , zone_role: 'header' },
  { id: 'fld-production_product-description', object_api_name: 'production_product', api_name: 'description', label: 'Description', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true , zone_role: 'header' },
  { id: 'fld-production_product-features', object_api_name: 'production_product', api_name: 'features', label: 'Features', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 32, active: true, zone_role: 'header' },
  { id: 'fld-production_product-status', object_api_name: 'production_product', api_name: 'status', label: 'Status', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true , zone_role: 'header' },
  { id: 'fld-production_service-name', object_api_name: 'production_service', api_name: 'name', label: 'Name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true , zone_role: 'header' },
  { id: 'fld-production_service-status', object_api_name: 'production_service', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'service_status', lookup_object_api_name: null, sort_order: 20, active: true , zone_role: 'header' },
  { id: 'fld-production_service-description', object_api_name: 'production_service', api_name: 'description', label: 'Description', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true , zone_role: 'header' },
  // #185 Slice A (rev E section 7.2 + rev A section 4.2): line fields for the
  // 4 corrected header_lines objects - first lines group per type. zone_role
  // 'list' + show_in_column (policy line-field pattern, #218).
  { id: 'fld-executive_project-milestone_title', object_api_name: 'executive_project', api_name: 'milestone_title', label: 'Milestone title', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-executive_project-milestone_date', object_api_name: 'executive_project', api_name: 'milestone_date', label: 'Milestone date', data_type: 'date', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-executive_task-subtask_title', object_api_name: 'executive_task', api_name: 'subtask_title', label: 'Subtask title', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-executive_task-subtask_done', object_api_name: 'executive_task', api_name: 'subtask_done', label: 'Subtask done', data_type: 'boolean', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-production_product-variant_name', object_api_name: 'production_product', api_name: 'variant_name', label: 'Variant name', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-production_product-variant_price', object_api_name: 'production_product', api_name: 'variant_price', label: 'Variant price', data_type: 'currency', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-production_product-sku', object_api_name: 'production_product', api_name: 'sku', label: 'SKU', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 25, active: true, zone_role: 'header' },
  { id: 'fld-production_product-external_id', object_api_name: 'production_product', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 70, active: true, zone_role: 'header' },
  { id: 'fld-production_service-rate_item', object_api_name: 'production_service', api_name: 'rate_item', label: 'Rate item', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true, zone_role: 'list', show_in_column: true },
  { id: 'fld-production_service-rate_amount', object_api_name: 'production_service', api_name: 'rate_amount', label: 'Rate amount', data_type: 'currency', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true, zone_role: 'list', show_in_column: true },

  // #246 Slice C (rev E section 3, 2026-08-31): fields for the 15 new system
  // record types. All are structure=list, so no zone_role placement (fields
  // render in the tab's New/edit form; first four are the legacy columns).
  // Picklists wire to locked value sets: message_type,
  // treasury_transaction_classification, contact_kind (new, staff|public per
  // the rev D Distribution note) plus existing record_status / event_kind /
  // knowledge_kind / schedule_kind. name/status stated explicitly per object
  // to keep the seed deterministic against ensureObjectForRecordType
  // auto-seeding (same pattern as executive_policy / production_product).
  { id: 'fld-communication_message-name', object_api_name: 'communication_message', api_name: 'name', label: 'Message subject', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-communication_message-message_type', object_api_name: 'communication_message', api_name: 'message_type', label: 'Message type', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'message_type', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-communication_message-status', object_api_name: 'communication_message', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-communication_message-notes', object_api_name: 'communication_message', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-communication_report-name', object_api_name: 'communication_report', api_name: 'name', label: 'Report title', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-communication_report-status', object_api_name: 'communication_report', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-communication_report-summary', object_api_name: 'communication_report', api_name: 'summary', label: 'Summary', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-communication_report-notes', object_api_name: 'communication_report', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-communication_staff-name', object_api_name: 'communication_staff', api_name: 'name', label: 'Staff member', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-communication_staff-role', object_api_name: 'communication_staff', api_name: 'role', label: 'Role', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'staff_role', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-communication_staff-status', object_api_name: 'communication_staff', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-communication_staff-notes', object_api_name: 'communication_staff', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-communication_staff-organization_id', object_api_name: 'communication_staff', api_name: 'organization_id', label: 'Organization', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 50, active: true },
  { id: 'fld-communication_staff-external_id', object_api_name: 'communication_staff', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-communication_staff-vv_connection_uid', object_api_name: 'communication_staff', api_name: 'vv_connection_uid', label: 'VersaVoice connection uid', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 70, active: true },
  { id: 'fld-dissemination_sales-name', object_api_name: 'dissemination_sales', api_name: 'name', label: 'Sales item', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-dissemination_sales-status', object_api_name: 'dissemination_sales', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-dissemination_sales-description', object_api_name: 'dissemination_sales', api_name: 'description', label: 'Description', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-dissemination_sales-notes', object_api_name: 'dissemination_sales', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-dissemination_promotion_marketing-name', object_api_name: 'dissemination_promotion_marketing', api_name: 'name', label: 'Campaign name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-dissemination_promotion_marketing-status', object_api_name: 'dissemination_promotion_marketing', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-dissemination_promotion_marketing-description', object_api_name: 'dissemination_promotion_marketing', api_name: 'description', label: 'Description', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-dissemination_promotion_marketing-notes', object_api_name: 'dissemination_promotion_marketing', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-treasury_transaction-name', object_api_name: 'treasury_transaction', api_name: 'name', label: 'Transaction', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-treasury_transaction-document_kind', object_api_name: 'treasury_transaction', api_name: 'document_kind', label: 'Document kind', data_type: 'picklist', is_system: true, is_required: false, default_value: 'transaction', value_set_api_name: 'document_kind', lookup_object_api_name: null, sort_order: 12, active: true },
  { id: 'fld-treasury_transaction-classification', object_api_name: 'treasury_transaction', api_name: 'classification', label: 'Classification', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'treasury_transaction_classification', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-treasury_transaction-converted_from_id', object_api_name: 'treasury_transaction', api_name: 'converted_from_id', label: 'Converted from', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'treasury_transaction', sort_order: 55, active: true },
  { id: 'fld-treasury_transaction-amount', object_api_name: 'treasury_transaction', api_name: 'amount', label: 'Amount', data_type: 'currency', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-treasury_transaction-status', object_api_name: 'treasury_transaction', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-treasury_transaction-notes', object_api_name: 'treasury_transaction', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-treasury_transaction-currency', object_api_name: 'treasury_transaction', api_name: 'currency', label: 'Currency', data_type: 'text', is_system: true, is_required: false, default_value: 'USD', value_set_api_name: null, lookup_object_api_name: null, sort_order: 35, active: true },
  { id: 'fld-treasury_transaction-transaction_date', object_api_name: 'treasury_transaction', api_name: 'transaction_date', label: 'Date', data_type: 'date', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 15, active: true },
  { id: 'fld-treasury_transaction-category', object_api_name: 'treasury_transaction', api_name: 'category', label: 'Category', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 25, active: true },
  { id: 'fld-treasury_transaction-counterparty_organization_id', object_api_name: 'treasury_transaction', api_name: 'counterparty_organization_id', label: 'Counterparty', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 45, active: true },
  { id: 'fld-treasury_transaction-external_id', object_api_name: 'treasury_transaction', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-treasury_records_assets_materiel-name', object_api_name: 'treasury_records_assets_materiel', api_name: 'name', label: 'Item', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-treasury_records_assets_materiel-status', object_api_name: 'treasury_records_assets_materiel', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-treasury_records_assets_materiel-description', object_api_name: 'treasury_records_assets_materiel', api_name: 'description', label: 'Description', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-treasury_records_assets_materiel-notes', object_api_name: 'treasury_records_assets_materiel', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-treasury_records_assets_materiel-file', object_api_name: 'treasury_records_assets_materiel', api_name: 'file', label: 'File', data_type: 'file', is_system: true, is_required: false, default_value: null, value_set_api_name: 'file_mime', lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-qualification_examination-name', object_api_name: 'qualification_examination', api_name: 'name', label: 'Examination', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-qualification_examination-status', object_api_name: 'qualification_examination', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-qualification_examination-notes', object_api_name: 'qualification_examination', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-qualification_review-name', object_api_name: 'qualification_review', api_name: 'name', label: 'Review', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-qualification_review-status', object_api_name: 'qualification_review', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-qualification_review-notes', object_api_name: 'qualification_review', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-qualification_certifications_awards-name', object_api_name: 'qualification_certifications_awards', api_name: 'name', label: 'Certification or award', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-qualification_certifications_awards-status', object_api_name: 'qualification_certifications_awards', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-qualification_certifications_awards-notes', object_api_name: 'qualification_certifications_awards', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-contact-name', object_api_name: 'contact', api_name: 'name', label: 'Contact name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-contact-contact_kind', object_api_name: 'contact', api_name: 'contact_kind', label: 'Contact kind', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'contact_kind', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-contact-email', object_api_name: 'contact', api_name: 'email', label: 'Email', data_type: 'email', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-contact-phone', object_api_name: 'contact', api_name: 'phone', label: 'Phone', data_type: 'phone', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-contact-organization', object_api_name: 'contact', api_name: 'organization', label: 'Organization name', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-contact-organization_id', object_api_name: 'contact', api_name: 'organization_id', label: 'Organization', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 55, active: true },
  { id: 'fld-contact-external_id', object_api_name: 'contact', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 70, active: true },
  { id: 'fld-contact-vv_connection_uid', object_api_name: 'contact', api_name: 'vv_connection_uid', label: 'VersaVoice connection uid', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 80, active: true },
  { id: 'fld-organization-name', object_api_name: 'organization', api_name: 'name', label: 'Name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-organization-org_type', object_api_name: 'organization', api_name: 'org_type', label: 'Organization type', data_type: 'picklist', is_system: true, is_required: false, default_value: 'internal', value_set_api_name: 'org_type', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-organization-is_person', object_api_name: 'organization', api_name: 'is_person', label: 'Person organization', data_type: 'boolean', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-organization-parent_organization_id', object_api_name: 'organization', api_name: 'parent_organization_id', label: 'Parent organization', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 40, active: true },
  { id: 'fld-organization-slug', object_api_name: 'organization', api_name: 'slug', label: 'Slug', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-organization-is_active', object_api_name: 'organization', api_name: 'is_active', label: 'Active', data_type: 'boolean', is_system: true, is_required: false, default_value: 'true', value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-organization-logo_url', object_api_name: 'organization', api_name: 'logo_url', label: 'Logo', data_type: 'url', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 70, active: true },
  { id: 'fld-organization-notes', object_api_name: 'organization', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 80, active: true },
  { id: 'fld-organization-external_id', object_api_name: 'organization', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 90, active: true },
  { id: 'fld-contact-notes', object_api_name: 'contact', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-location-name', object_api_name: 'location', api_name: 'name', label: 'Label', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-location-address', object_api_name: 'location', api_name: 'address', label: 'Address', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-location-country', object_api_name: 'location', api_name: 'country', label: 'Country', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-location-status', object_api_name: 'location', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-location-notes', object_api_name: 'location', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-location-line_1', object_api_name: 'location', api_name: 'line_1', label: 'Address line 1', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 22, active: true },
  { id: 'fld-location-line_2', object_api_name: 'location', api_name: 'line_2', label: 'Address line 2', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 24, active: true },
  { id: 'fld-location-city', object_api_name: 'location', api_name: 'city', label: 'City', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 26, active: true },
  { id: 'fld-location-state', object_api_name: 'location', api_name: 'state', label: 'State', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 28, active: true },
  { id: 'fld-location-postal_code', object_api_name: 'location', api_name: 'postal_code', label: 'Postal code', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 29, active: true },
  { id: 'fld-location-is_primary', object_api_name: 'location', api_name: 'is_primary', label: 'Primary address', data_type: 'boolean', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 32, active: true },
  { id: 'fld-location-organization_id', object_api_name: 'location', api_name: 'organization_id', label: 'Organization', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 35, active: true },
  { id: 'fld-location-external_id', object_api_name: 'location', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-event-name', object_api_name: 'event', api_name: 'name', label: 'Title', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-event-kind', object_api_name: 'event', api_name: 'kind', label: 'Kind', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'event_kind', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-event-status', object_api_name: 'event', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-event-description', object_api_name: 'event', api_name: 'description', label: 'Description', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-knowledge-name', object_api_name: 'knowledge', api_name: 'name', label: 'Title', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-knowledge-kind', object_api_name: 'knowledge', api_name: 'kind', label: 'Asset type', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'knowledge_kind', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-knowledge-status', object_api_name: 'knowledge', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-knowledge-summary', object_api_name: 'knowledge', api_name: 'summary', label: 'Summary', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-knowledge-file', object_api_name: 'knowledge', api_name: 'file', label: 'File', data_type: 'file', is_system: true, is_required: false, default_value: null, value_set_api_name: 'file_mime', lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-schedule-name', object_api_name: 'schedule', api_name: 'name', label: 'Label', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-schedule-kind', object_api_name: 'schedule', api_name: 'kind', label: 'Kind', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'schedule_kind', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-schedule-status', object_api_name: 'schedule', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-schedule-notes', object_api_name: 'schedule', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-schedule-interval_count', object_api_name: 'schedule', api_name: 'interval_count', label: 'Interval count', data_type: 'number', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-schedule-interval_unit', object_api_name: 'schedule', api_name: 'interval_unit', label: 'Interval unit', data_type: 'picklist', is_system: true, is_required: false, default_value: 'week', value_set_api_name: 'interval_unit', lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-schedule-interval_iso', object_api_name: 'schedule', api_name: 'interval_iso', label: 'Interval (ISO 8601)', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 70, active: true },
  { id: 'fld-environment_stat-name', object_api_name: 'environment_stat', api_name: 'name', label: 'Name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-environment_stat-value', object_api_name: 'environment_stat', api_name: 'value', label: 'Value', data_type: 'number', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-environment_stat-unit', object_api_name: 'environment_stat', api_name: 'unit', label: 'Unit', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-environment_stat-category', object_api_name: 'environment_stat', api_name: 'category', label: 'Category', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-environment_stat-scale', object_api_name: 'environment_stat', api_name: 'scale', label: 'Scale', data_type: 'picklist', is_system: true, is_required: false, default_value: 'month', value_set_api_name: 'stat_scale', lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-environment_stat-series', object_api_name: 'environment_stat', api_name: 'series', label: 'Series', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-environment_stat-status', object_api_name: 'environment_stat', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'record_status', lookup_object_api_name: null, sort_order: 70, active: true },

  // Collaboration / Vendor / {Credentials | Integrations | Exchange}
  { id: 'fld-vendor_credential-name', object_api_name: 'vendor_credential', api_name: 'name', label: 'Name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-vendor_credential-auth_type', object_api_name: 'vendor_credential', api_name: 'auth_type', label: 'Auth type', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'credential_auth_type', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-vendor_credential-organization_id', object_api_name: 'vendor_credential', api_name: 'organization_id', label: 'Vendor', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 30, active: true },
  { id: 'fld-vendor_credential-configuration', object_api_name: 'vendor_credential', api_name: 'configuration', label: 'Configuration', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 40, active: true },
  { id: 'fld-vendor_credential-notes', object_api_name: 'vendor_credential', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 50, active: true },
  { id: 'fld-vendor_credential-external_id', object_api_name: 'vendor_credential', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-vendor_integration-name', object_api_name: 'vendor_integration', api_name: 'name', label: 'Name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-vendor_integration-kind', object_api_name: 'vendor_integration', api_name: 'kind', label: 'Kind', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'integration_kind', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-vendor_integration-status', object_api_name: 'vendor_integration', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'integration_status', lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-vendor_integration-organization_id', object_api_name: 'vendor_integration', api_name: 'organization_id', label: 'Vendor', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 40, active: true },
  { id: 'fld-vendor_integration-credential_id', object_api_name: 'vendor_integration', api_name: 'credential_id', label: 'Credential', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'vendor_credential', sort_order: 50, active: true },
  { id: 'fld-vendor_integration-notes', object_api_name: 'vendor_integration', api_name: 'notes', label: 'Notes', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 60, active: true },
  { id: 'fld-vendor_integration-external_id', object_api_name: 'vendor_integration', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 70, active: true },
  { id: 'fld-vendor_exchange-name', object_api_name: 'vendor_exchange', api_name: 'name', label: 'Name', data_type: 'text', is_system: true, is_required: true, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 10, active: true },
  { id: 'fld-vendor_exchange-origin', object_api_name: 'vendor_exchange', api_name: 'origin', label: 'Origin', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'exchange_origin', lookup_object_api_name: null, sort_order: 20, active: true },
  { id: 'fld-vendor_exchange-status', object_api_name: 'vendor_exchange', api_name: 'status', label: 'Status', data_type: 'picklist', is_system: true, is_required: false, default_value: null, value_set_api_name: 'exchange_status', lookup_object_api_name: null, sort_order: 30, active: true },
  { id: 'fld-vendor_exchange-integration_id', object_api_name: 'vendor_exchange', api_name: 'integration_id', label: 'Integration', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'vendor_integration', sort_order: 40, active: true },
  { id: 'fld-vendor_exchange-source_organization_id', object_api_name: 'vendor_exchange', api_name: 'source_organization_id', label: 'Source organization', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 50, active: true },
  { id: 'fld-vendor_exchange-target_organization_id', object_api_name: 'vendor_exchange', api_name: 'target_organization_id', label: 'Target organization', data_type: 'lookup', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: 'organization', sort_order: 60, active: true },
  { id: 'fld-vendor_exchange-source_table', object_api_name: 'vendor_exchange', api_name: 'source_table', label: 'Source table', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 70, active: true },
  { id: 'fld-vendor_exchange-source_id', object_api_name: 'vendor_exchange', api_name: 'source_id', label: 'Source id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 80, active: true },
  { id: 'fld-vendor_exchange-payload', object_api_name: 'vendor_exchange', api_name: 'payload', label: 'Payload', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 90, active: true },
  { id: 'fld-vendor_exchange-replicate', object_api_name: 'vendor_exchange', api_name: 'replicate', label: 'Replicate', data_type: 'boolean', is_system: true, is_required: false, default_value: 'false', value_set_api_name: null, lookup_object_api_name: null, sort_order: 100, active: true },
  { id: 'fld-vendor_exchange-error_message', object_api_name: 'vendor_exchange', api_name: 'error_message', label: 'Error message', data_type: 'long_text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 110, active: true },
  { id: 'fld-vendor_exchange-external_id', object_api_name: 'vendor_exchange', api_name: 'external_id', label: 'External id', data_type: 'text', is_system: true, is_required: false, default_value: null, value_set_api_name: null, lookup_object_api_name: null, sort_order: 120, active: true },
];

/** Platform audit lookups on every seeded faculty/collaboration/environment object. */
function withPlatformAudit(fields: FieldDefinition[]): FieldDefinition[] {
  const objects = [...new Set(fields.map((f) => f.object_api_name))];
  const have = new Set(fields.map((f) => `${f.object_api_name}::${f.api_name}`));
  const extra: FieldDefinition[] = [];
  for (const object_api_name of objects) {
    if (!have.has(`${object_api_name}::created_by`)) {
      extra.push({
        id: `fld-${object_api_name}-created_by`,
        object_api_name,
        api_name: 'created_by',
        label: 'Created by',
        data_type: 'lookup',
        is_system: true,
        is_required: false,
        default_value: null,
        value_set_api_name: null,
        lookup_object_api_name: 'user',
        sort_order: 9000,
        active: true,
      });
    }
    if (!have.has(`${object_api_name}::last_modified_by`)) {
      extra.push({
        id: `fld-${object_api_name}-last_modified_by`,
        object_api_name,
        api_name: 'last_modified_by',
        label: 'Last modified by',
        data_type: 'lookup',
        is_system: true,
        is_required: false,
        default_value: null,
        value_set_api_name: null,
        lookup_object_api_name: 'user',
        sort_order: 9010,
        active: true,
      });
    }
  }
  return [...fields, ...extra];
}

const facultyRecordFieldSeed: FieldDefinition[] = withPlatformAudit(facultyRecordFieldSeedBase);

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
    api_name: 'organization',
    label: 'Organization',
    description: 'Typed core organization table (Executive Orgs + Collaboration parties).',
    core_kind: 'typed_table',
    instance_collection: '/api/organizations',
    extensible: true,
    faculty: 'executive',
  },
                    ];

type CatalogLive = {
  fields: FieldDefinition[];
  valueSets: ValueSet[];
  valueSetItems: ValueSetItem[];
  layouts: LayoutDefinition[];
  objects: ObjectDefinition[];
};

const CATALOG_LIVE_KEY = "__versaCatalogLive__";

function catalogLive(): CatalogLive {
  const g = globalThis as Record<string, unknown>;
  const existing = g[CATALOG_LIVE_KEY] as CatalogLive | undefined;
  if (existing) return existing;
  const seeded: CatalogLive = {
    fields: [...fieldDefinitions, ...facultyRecordFieldSeed],
    valueSets: [...valueSets],
    valueSetItems: [...valueSetItems],
    layouts: [...layoutDefinitions],
    objects: [...objectDefinitions],
  };
  g[CATALOG_LIVE_KEY] = seeded;
  return seeded;
}

type CatalogHook = () => void;
type CatalogHooks = { hydrate: CatalogHook; persist: CatalogHook };
const CATALOG_HOOKS_KEY = "__versaCatalogDurableHooks__";

export function installCatalogDurableHooks(hooks: CatalogHooks): void {
  (globalThis as Record<string, unknown>)[CATALOG_HOOKS_KEY] = hooks;
}

function catalogHooks(): CatalogHooks | null {
  return (
    ((globalThis as Record<string, unknown>)[CATALOG_HOOKS_KEY] as CatalogHooks | null) ??
    null
  );
}

function ensureCatalogHydrated(): void {
  catalogHooks()?.hydrate();
}

function persistCatalog(): void {
  catalogHooks()?.persist();
}

export function exportCatalogLive(): {
  fields: FieldDefinition[];
  valueSets: ValueSet[];
  valueSetItems: ValueSetItem[];
  layouts: LayoutDefinition[];
  objects: ObjectDefinition[];
} {
  return {
    fields: catalogLive().fields,
    valueSets: catalogLive().valueSets,
    valueSetItems: catalogLive().valueSetItems,
    layouts: catalogLive().layouts,
    objects: catalogLive().objects,
  };
}

export function applyCatalogOverlay(overlay: {
  fields?: FieldDefinition[];
  valueSets?: ValueSet[];
  valueSetItems?: ValueSetItem[];
  layouts?: LayoutDefinition[];
  objects?: ObjectDefinition[];
  systemSeedWins?: boolean;
}): void {
  const fieldKey = (f: FieldDefinition) => `${f.object_api_name}::${f.api_name}`;
  const vsKey = (v: ValueSet) => v.api_name;
  const itemKey = (i: ValueSetItem) => `${i.value_set_id}::${i.api_value}`;
  const layoutKey = (l: LayoutDefinition) => `${l.object_api_name}::${l.api_name}::${l.layout_type}::${l.version}`;
  const objectKey = (o: ObjectDefinition) => o.api_name;

  const merge = <T,>(
    seed: T[],
    over: T[] | undefined,
    keyOf: (row: T) => string,
    seedWins?: (row: T) => boolean,
  ): T[] => {
    if (!over?.length) return [...seed];
    const map = new Map(over.map((row) => [keyOf(row), row]));
    const seen = new Set<string>();
    const out: T[] = [];
    for (const row of seed) {
      const key = keyOf(row);
      const patch = map.get(key);
      out.push(patch && !seedWins?.(row) ? { ...row, ...patch } : row);
      seen.add(key);
    }
    for (const row of over) {
      const key = keyOf(row);
      if (!seen.has(key)) out.push(row);
    }
    return out;
  };

  const seedFields = [...fieldDefinitions, ...facultyRecordFieldSeed];
  const systemSeedWins = Boolean(overlay.systemSeedWins);
  catalogLive().fields = merge(
    seedFields,
    overlay.fields,
    fieldKey,
    (row) => systemSeedWins && row.is_system,
  ).map((row) => {
    const seed = seedFields.find((s) => fieldKey(s) === fieldKey(row));
    return seed ? { ...row, is_system: seed.is_system, id: seed.id } : row;
  });
  catalogLive().valueSets = merge(valueSets, overlay.valueSets, vsKey, () => systemSeedWins);
  catalogLive().valueSetItems = merge(
    valueSetItems,
    overlay.valueSetItems,
    itemKey,
    () => systemSeedWins,
  );
  catalogLive().layouts = merge(layoutDefinitions, overlay.layouts, layoutKey, () => systemSeedWins);
  catalogLive().objects = merge(objectDefinitions, overlay.objects, objectKey, () => systemSeedWins);
}

export function resetCatalog(): void {
  catalogLive().fields = [...fieldDefinitions, ...facultyRecordFieldSeed];
  catalogLive().valueSets = [...valueSets];
  catalogLive().valueSetItems = [...valueSetItems];
  catalogLive().layouts = [...layoutDefinitions];
  catalogLive().objects = [...objectDefinitions];
}

export function listObjects(): ObjectDefinition[] {
  ensureCatalogHydrated();
  return [...catalogLive().objects].sort((a, b) => a.api_name.localeCompare(b.api_name));
}

export function getObject(apiName: string): ObjectDefinition | undefined {
  ensureCatalogHydrated();
  return catalogLive().objects.find((o) => o.api_name === apiName);
}

export function getValueSetByApiName(apiName: string): ValueSet | undefined {
  ensureCatalogHydrated();
  return catalogLive().valueSets.find((v) => v.api_name === apiName);
}

export function listValueSetItems(valueSetId: string): ValueSetItem[] {
  ensureCatalogHydrated();
  return catalogLive().valueSetItems
    .filter((i) => i.value_set_id === valueSetId && i.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function listFieldDefinitions(objectApiName: string): FieldDefinition[] {
  ensureCatalogHydrated();
  return catalogLive().fields
    .filter((f) => f.object_api_name === objectApiName && f.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getDefaultLayout(
  objectApiName: string,
  layoutType: LayoutDefinition['layout_type'],
): LayoutDefinition | undefined {
  ensureCatalogHydrated();
  return catalogLive().layouts.find(
    (l) =>
      l.object_api_name === objectApiName &&
      l.layout_type === layoutType &&
      l.is_default,
  );
}

export function listAllFieldDefinitions(objectApiName?: string): FieldDefinition[] {
  ensureCatalogHydrated();
  let rows = catalogLive().fields.filter((f) => f.active);
  if (objectApiName) rows = rows.filter((f) => f.object_api_name === objectApiName);
  return rows.sort((a, b) => a.sort_order - b.sort_order || a.api_name.localeCompare(b.api_name));
}


/** L2: normalize zone_role so every field on a header_lines object is exactly header or list (never null/both). */
export function normalizeZoneRoles(objectApiName: string): void {
  for (let i = 0; i < catalogLive().fields.length; i++) {
    const f = catalogLive().fields[i];
    if (f.object_api_name !== objectApiName) continue;
    if (f.zone_role !== "header" && f.zone_role !== "list") {
      catalogLive().fields[i] = { ...f, zone_role: "header" };
    }
  }
}
export function listAllLayouts(
  objectApiName?: string,
  layoutType?: LayoutDefinition['layout_type'],
): LayoutDefinition[] {
  ensureCatalogHydrated();
  let rows = [...catalogLive().layouts];
  if (objectApiName) rows = rows.filter((l) => l.object_api_name === objectApiName);
  if (layoutType) rows = rows.filter((l) => l.layout_type === layoutType);
  return rows;
}

export function listAllValueSets(): ValueSet[] {
  ensureCatalogHydrated();
  return [...catalogLive().valueSets].sort((a, b) => a.api_name.localeCompare(b.api_name));
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
  'file',
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
  /** Slice F (C2): lookup delete rule - cascade or orphan (default orphan). */
  lookup_delete_rule?: 'cascade' | 'orphan' | null;
  zone_role?: "header" | "list" | null;
  /** O1: explicit lines-table column flag for list-zone fields. */
  show_in_column?: boolean;
}

export type ExtendFieldResult =
  | { ok: true; field: FieldDefinition }
  | { ok: false; code: string; message: string };

/** Agent/admin extension: add a non-system field definition (durable catalog overlay). */
export function extendFieldDefinition(input: ExtendFieldInput): ExtendFieldResult {
  ensureCatalogHydrated();
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
  const named = validateTenantApiName(apiName);
  if (!named.ok) {
    return { ok: false, code: named.code, message: named.message };
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
  // Slice F (C2): lookup_delete_rule only applies to lookup fields and must be
  // cascade or orphan. NULL/undefined reads as the locked default 'orphan'.
  if (input.lookup_delete_rule != null) {
    if (input.data_type !== 'lookup') {
      return {
        ok: false,
        code: 'DELETE_RULE_NOT_LOOKUP',
        message: 'lookup_delete_rule applies only to lookup fields.',
      };
    }
    if (input.lookup_delete_rule !== 'cascade' && input.lookup_delete_rule !== 'orphan') {
      return {
        ok: false,
        code: 'INVALID_DELETE_RULE',
        message: 'lookup_delete_rule must be cascade or orphan.',
      };
    }
  }
  if (input.lookup_object_api_name && !getObject(input.lookup_object_api_name)) {
    return {
      ok: false,
      code: 'UNKNOWN_LOOKUP_OBJECT',
      message: `Unknown lookup_object_api_name '${input.lookup_object_api_name}'.`,
    };
  }
  const exists = catalogLive().fields.some(
    (f) => f.object_api_name === input.object_api_name && f.api_name === apiName,
  );
  if (exists) {
    return {
      ok: false,
      code: 'FIELD_EXISTS',
      message: `Field '${apiName}' already exists on '${input.object_api_name}'.`,
    };
  }
  const siblings = catalogLive().fields.filter((f) => f.object_api_name === input.object_api_name);
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
    lookup_delete_rule: input.lookup_delete_rule ?? null,
    sort_order: nextOrder,
    zone_role: input.zone_role ?? null,
    show_in_column: input.show_in_column,
    active: true,
  };
  catalogLive().fields.push(field);
  persistCatalog();
  return { ok: true, field };
}

// ---------------------------------------------------------------------------
// Field lifecycle mutations (nested Record Type ownership) — I5.6.32c
// ---------------------------------------------------------------------------

export type UpdateFieldInput = Partial<Pick<FieldDefinition,
  'label' | 'is_required' | 'default_value' | 'value_set_api_name' |
  'lookup_object_api_name' | 'lookup_delete_rule' | 'sort_order' | 'active' | 'zone_role' |
  'show_in_column'
>>;

export type FieldMutationResult =
  | { ok: true; field: FieldDefinition; references: number }
  | { ok: false; code: string; message: string; references?: number };

function fieldReferenceCount(objectApiName: string, apiName: string): number {
  return listInstances({ type_api_name: objectApiName }).filter((instance) =>
    Object.prototype.hasOwnProperty.call(instance.data, apiName),
  ).length;
}

export function updateFieldDefinition(
  objectApiName: string,
  apiName: string,
  input: UpdateFieldInput,
): FieldMutationResult {
  ensureCatalogHydrated();
  const index = catalogLive().fields.findIndex(
    (field) => field.object_api_name === objectApiName && field.api_name === apiName,
  );
  if (index < 0) return { ok: false, code: 'NOT_FOUND', message: `Unknown field '${apiName}'.` };
  const current = catalogLive().fields[index];
  if (input.label !== undefined && !input.label.trim()) {
    return { ok: false, code: 'LABEL_REQUIRED', message: 'Field label is required.' };
  }
  if (input.value_set_api_name && !getValueSetByApiName(input.value_set_api_name)) {
    return { ok: false, code: 'UNKNOWN_VALUE_SET', message: `Unknown value_set_api_name '${input.value_set_api_name}'.` };
  }
  const next: FieldDefinition = {
    ...current,
    ...input,
    label: input.label !== undefined ? input.label.trim() : current.label,
  };
  catalogLive().fields[index] = next;
  persistCatalog();
  return { ok: true, field: next, references: fieldReferenceCount(objectApiName, apiName) };
}

export function retireFieldDefinition(objectApiName: string, apiName: string): FieldMutationResult {
  return updateFieldDefinition(objectApiName, apiName, { active: false });
}

export function deleteFieldDefinition(objectApiName: string, apiName: string): FieldMutationResult {
  const index = catalogLive().fields.findIndex(
    (field) => field.object_api_name === objectApiName && field.api_name === apiName,
  );
  if (index < 0) return { ok: false, code: 'NOT_FOUND', message: `Unknown field '${apiName}'.` };
  const field = catalogLive().fields[index];
  const references = fieldReferenceCount(objectApiName, apiName);
  if (field.is_system) {
    return { ok: false, code: 'SYSTEM_FIELD', message: 'System/reference fields cannot be hard-deleted.', references };
  }
  if (references > 0) {
    return { ok: false, code: 'FIELD_REFERENCED', message: 'Referenced fields must be retired instead of hard-deleted.', references };
  }
  catalogLive().fields.splice(index, 1);
  persistCatalog();
  return { ok: true, field, references: 0 };
}

// ---------------------------------------------------------------------------
// Value set mutations (Records Editor picklist options) — I5.6.32c
// ---------------------------------------------------------------------------

export interface CreateValueSetInput {
  api_name: string;
  label: string;
  description?: string;
  items?: Array<{ api_value: string; label: string; sort_order?: number }>;
}

export type ValueSetMutResult =
  | { ok: true; value_set: ValueSet; items: ValueSetItem[] }
  | { ok: false; code: string; message: string };

export function createValueSet(input: CreateValueSetInput): ValueSetMutResult {
  ensureCatalogHydrated();
  const apiName = (input.api_name || '').trim();
  if (!/^[a-z][a-z0-9_]*$/.test(apiName)) {
    return {
      ok: false,
      code: 'INVALID_API_NAME',
      message: 'api_name must be snake_case starting with a letter.',
    };
  }
  if (catalogLive().valueSets.some((v) => v.api_name === apiName)) {
    return { ok: false, code: 'EXISTS', message: `Value set '${apiName}' already exists.` };
  }
  const vs: ValueSet = {
    id: `vs-${apiName}`,
    api_name: apiName,
    label: (input.label || apiName).trim(),
    description: (input.description || '').trim(),
  };
  catalogLive().valueSets.push(vs);
  const items: ValueSetItem[] = [];
  for (const [i, it] of (input.items || []).entries()) {
    const api_value = (it.api_value || '').trim();
    if (!api_value) continue;
    const item: ValueSetItem = {
      id: `vsi-${apiName}-${api_value}`,
      value_set_id: vs.id,
      api_value,
      label: (it.label || api_value).trim(),
      sort_order: it.sort_order ?? (i + 1) * 10,
      active: true,
    };
    catalogLive().valueSetItems.push(item);
    items.push(item);
  }
  persistCatalog();
  return { ok: true, value_set: vs, items };
}

export function addValueSetItem(
  valueSetApiName: string,
  input: { api_value: string; label: string; sort_order?: number },
): ValueSetMutResult {
  const vs = getValueSetByApiName(valueSetApiName);
  if (!vs) {
    return { ok: false, code: 'NOT_FOUND', message: `Unknown value set '${valueSetApiName}'.` };
  }
  const api_value = (input.api_value || '').trim();
  if (!api_value) {
    return { ok: false, code: 'INVALID', message: 'api_value is required.' };
  }
  if (catalogLive().valueSetItems.some((i) => i.value_set_id === vs.id && i.api_value === api_value)) {
    return { ok: false, code: 'EXISTS', message: `Option '${api_value}' already exists.` };
  }
  const siblings = catalogLive().valueSetItems.filter((i) => i.value_set_id === vs.id);
  const item: ValueSetItem = {
    id: `vsi-${vs.api_name}-${api_value}`,
    value_set_id: vs.id,
    api_value,
    label: (input.label || api_value).trim(),
    sort_order: input.sort_order ?? siblings.reduce((m, i) => Math.max(m, i.sort_order), 0) + 10,
    active: true,
  };
  catalogLive().valueSetItems.push(item);
  persistCatalog();
  return { ok: true, value_set: vs, items: listValueSetItems(vs.id) };
}


export type DeleteValueSetItemResult =
  | { ok: true; value_set: ValueSet; items: ValueSetItem[]; remapped: number }
  | { ok: false; code: string; message: string; reference_count?: number };

/** Count fixture references to a picklist api_value (field defaults + record instance data). */
export function countValueSetItemReferences(
  valueSetApiName: string,
  apiValue: string,
): number {
  const vs = getValueSetByApiName(valueSetApiName);
  if (!vs) return 0;
  let count = 0;
  for (const f of catalogLive().fields) {
    if (f.value_set_api_name !== valueSetApiName) continue;
    if (f.default_value === apiValue) {
      count += 1;
      continue;
    }
    if (
      f.default_value &&
      f.data_type === 'multipicklist' &&
      f.default_value
        .split(',')
        .map((s) => s.trim())
        .includes(apiValue)
    ) {
      count += 1;
    }
  }
  const fieldsForVs = catalogLive().fields.filter(
    (f) => f.value_set_api_name === valueSetApiName,
  );
  const fieldNames = new Set(fieldsForVs.map((f) => f.api_name));
  for (const inst of listInstances({})) {
    if (inst.status === apiValue && fieldNames.has('status')) count += 1;
    for (const [k, v] of Object.entries(inst.data || {})) {
      if (!fieldNames.has(k)) continue;
      if (v === apiValue) count += 1;
      else if (
        typeof v === 'string' &&
        v
          .split(',')
          .map((s) => s.trim())
          .includes(apiValue)
      ) {
        count += 1;
      }
    }
  }
  return count;
}

function remapValueSetItemReferences(
  valueSetApiName: string,
  fromValue: string,
  toValue: string,
): number {
  let remapped = 0;
  for (const f of catalogLive().fields) {
    if (f.value_set_api_name !== valueSetApiName) continue;
    if (f.default_value === fromValue) {
      f.default_value = toValue;
      remapped += 1;
    } else if (f.default_value && f.data_type === 'multipicklist') {
      const parts = f.default_value.split(',').map((s) => s.trim());
      if (parts.includes(fromValue)) {
        f.default_value = parts.map((p) => (p === fromValue ? toValue : p)).join(',');
        remapped += 1;
      }
    }
  }
  const fieldsForVs = catalogLive().fields.filter(
    (f) => f.value_set_api_name === valueSetApiName,
  );
  const fieldNames = new Set(fieldsForVs.map((f) => f.api_name));
  for (const inst of listInstances({})) {
    if (fieldNames.has('status') && inst.status === fromValue) {
      (inst as { status: string }).status = toValue;
      remapped += 1;
    }
    for (const k of Object.keys(inst.data || {})) {
      if (!fieldNames.has(k)) continue;
      const v = inst.data[k];
      if (v === fromValue) {
        inst.data[k] = toValue;
        remapped += 1;
      } else if (typeof v === 'string' && v.includes(',')) {
        const parts = v.split(',').map((s) => s.trim());
        if (parts.includes(fromValue)) {
          inst.data[k] = parts.map((p) => (p === fromValue ? toValue : p)).join(',');
          remapped += 1;
        }
      }
    }
  }
  return remapped;
}

/**
 * Delete a picklist option. When existing references are found, replacement_api_value
 * is required and all fixture references are remapped to it (I5.6.32 Slice 2.1 #220).
 */
export function deleteValueSetItem(
  valueSetApiName: string,
  apiValue: string,
  replacementApiValue?: string | null,
): DeleteValueSetItemResult {
  const vs = getValueSetByApiName(valueSetApiName);
  if (!vs) {
    return { ok: false, code: 'NOT_FOUND', message: `Unknown value set '${valueSetApiName}'.` };
  }
  const itemIdx = catalogLive().valueSetItems.findIndex(
    (i) => i.value_set_id === vs.id && i.api_value === apiValue && i.active,
  );
  if (itemIdx < 0) {
    return {
      ok: false,
      code: 'ITEM_NOT_FOUND',
      message: `Option '${apiValue}' not found on value set '${valueSetApiName}'.`,
    };
  }
  const remaining = catalogLive().valueSetItems.filter(
    (i) => i.value_set_id === vs.id && i.active && i.api_value !== apiValue,
  );
  const refs = countValueSetItemReferences(valueSetApiName, apiValue);
  if (refs > 0) {
    const replacement = (replacementApiValue || '').trim();
    if (!replacement) {
      return {
        ok: false,
        code: 'REPLACEMENT_REQUIRED',
        message: `Option '${apiValue}' is used by ${refs} reference(s). Pick a replacement from the remaining options.`,
        reference_count: refs,
      };
    }
    if (replacement === apiValue) {
      return {
        ok: false,
        code: 'INVALID_REPLACEMENT',
        message: 'Replacement must be a different option.',
        reference_count: refs,
      };
    }
    if (!remaining.some((i) => i.api_value === replacement)) {
      return {
        ok: false,
        code: 'INVALID_REPLACEMENT',
        message: `Replacement '${replacement}' is not an active option on this picklist.`,
        reference_count: refs,
      };
    }
    const remapped = remapValueSetItemReferences(valueSetApiName, apiValue, replacement);
    catalogLive().valueSetItems.splice(itemIdx, 1);
    persistCatalog();
    return { ok: true, value_set: vs, items: listValueSetItems(vs.id), remapped };
  }
  catalogLive().valueSetItems.splice(itemIdx, 1);
  persistCatalog();
  return { ok: true, value_set: vs, items: listValueSetItems(vs.id), remapped: 0 };
}

/** Remove catalog object + its field/layout definitions (custom type cascade). */
export function cascadeDeleteObjectForRecordType(objectApiName: string): {
  fields_removed: number;
  layouts_removed: number;
  object_removed: boolean;
} {
  const beforeFields = catalogLive().fields.length;
  catalogLive().fields = catalogLive().fields.filter(
    (f) => f.object_api_name !== objectApiName,
  );
  const fields_removed = beforeFields - catalogLive().fields.length;

  const beforeLayouts = catalogLive().layouts.length;
  catalogLive().layouts = catalogLive().layouts.filter(
    (l) => l.object_api_name !== objectApiName,
  );
  const layouts_removed = beforeLayouts - catalogLive().layouts.length;

  const objIdx = catalogLive().objects.findIndex((o) => o.api_name === objectApiName);
  let object_removed = false;
  if (objIdx >= 0) {
    // Only remove non-core objects that were registered for custom record types
    const obj = catalogLive().objects[objIdx];
    if (obj.core_kind === 'faculty_record' || obj.instance_collection == null) {
      catalogLive().objects.splice(objIdx, 1);
      object_removed = true;
    }
  }
  persistCatalog();
  return { fields_removed, layouts_removed, object_removed };
}

export function ensureObjectForRecordType(input: {
  api_name: string;
  label: string;
  description?: string;
  faculty?: string;
}): ObjectDefinition {
  const existing = getObject(input.api_name);
  let changed = false;
  const obj =
    existing ??
    ({
      api_name: input.api_name,
      label: input.label,
      description: input.description || `Record type ${input.api_name}`,
      core_kind: 'faculty_record',
      instance_collection: null,
      extensible: true,
      faculty: input.faculty,
    } as ObjectDefinition);
  if (!existing) {
    catalogLive().objects.push(obj);
    changed = true;
  }

  // Seed core name/status fields so zone Executive (and other) subtabs render real catalog fields
  // instead of falling back to generic Name/Status placeholders only.
  const ensureField = (apiName: string, label: string, sortOrder: number) => {
    const has = catalogLive().fields.some(
      (f) => f.object_api_name === input.api_name && f.api_name === apiName,
    );
    if (has) return;
    catalogLive().fields.push({
      id: `fld-${input.api_name}-${apiName}`,
      object_api_name: input.api_name,
      api_name: apiName,
      label,
      data_type: 'text',
      is_system: true,
      is_required: apiName === 'name',
      default_value: null,
      value_set_api_name: null,
      lookup_object_api_name: null,
      sort_order: sortOrder,
      active: true,
    });
    changed = true;
  };
  ensureField('name', 'Name', 10);
  ensureField('status', 'Status', 20);
  if (changed) persistCatalog();
  return obj;
}

/** Repair path: register catalog objects for every known record type (existing custom types). */
export function ensureObjectsForAllRecordTypes(
  types: Array<{
    api_name: string;
    label: string;
    description?: string;
    parent_kind?: string;
    parent_api_name?: string;
    object_api_name?: string;
  }>,
): { ensured: string[] } {
  const ensured: string[] = [];
  for (const t of types) {
    const api = (t.object_api_name || t.api_name || '').trim();
    if (!api) continue;
    ensureObjectForRecordType({
      api_name: api,
      label: t.label || api,
      description: t.description,
      faculty: t.parent_kind === 'faculty' ? t.parent_api_name : undefined,
    });
    ensured.push(api);
  }
  return { ensured: [...new Set(ensured)] };
}
