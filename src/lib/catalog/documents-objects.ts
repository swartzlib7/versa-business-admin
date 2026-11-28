/**
 * 1.0.23: every business record type holds files in a Documents & Photos field (Attachments),
 * as Assets has since 1.0.14, and so do organizations (vendors, customers, partners, branches
 * and your own: the `organization` object; the `vendor` … `branch` record types are only
 * containers). System types (Pages, Elements, Drivers, Configuration, Credentials,
 * Integrations, Exchange, Statistics) and the faculty containers have none. Shipments (1.0.26)
 * have it from the start.
 */
export const DOCUMENTS_OBJECTS = [
  'organization', 'treasury_transaction', 'contact',
  'executive_project', 'executive_policy', 'executive_hat',
  'production_product', 'production_service', 'production_shipment',
  'dissemination_sales', 'dissemination_promotion_marketing',
  'inspection_report', 'communication_staff', 'communication_message',
  'qualification_review', 'qualification_examination', 'qualification_certifications_awards',
  'knowledge', 'event', 'location', 'schedule', 'treasury_vehicle_mileage_log',
] as const;
