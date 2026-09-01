// #246 Slice C sanity — rev E §3/§7.4/§7.6 fixture-level assertions
import { readFileSync } from 'fs';
import { recordTypes } from '../src/lib/fixtures/record-types';
import { listFieldDefinitions, valueSets, valueSetItems } from '../src/lib/fixtures/catalog';
import { applyRecordTypesToTab } from '../src/lib/zones/record-type-tabs';

let pass = 0, fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); }
}

// 1. 15 new system types seeded (rev E §3)
const expected: Array<[string, string, string]> = [
  ['communication_message', 'communications', 'faculty'],
  ['communication_report', 'communications', 'faculty'],
  ['communication_staff', 'communications', 'faculty'],
  ['dissemination_sales', 'dissemination', 'faculty'],
  ['dissemination_promotion_marketing', 'dissemination', 'faculty'],
  ['treasury_transaction', 'treasury', 'faculty'],
  ['treasury_records_assets_materiel', 'treasury', 'faculty'],
  ['qualification_examination', 'qualification', 'faculty'],
  ['qualification_review', 'qualification', 'faculty'],
  ['qualification_certifications_awards', 'qualification', 'faculty'],
  ['contact', 'public', 'faculty'],
  ['location', 'locations', 'environment'],
  ['event', 'events', 'environment'],
  ['knowledge', 'knowledge', 'environment'],
  ['schedule', 'schedules', 'environment'],
];
const byApi: Record<string, (typeof recordTypes)[number]> = {};
for (const t of recordTypes) byApi[t.api_name] = t;
for (const [api, parent, kind] of expected) {
  const t = byApi[api];
  ok(!!t, api + ' seeded');
  if (!t) continue;
  ok(t.structure === 'list', api + ' structure=list');
  ok(t.is_system === true, api + ' is_system');
  ok(t.active === true, api + ' active');
  ok(t.show_as_tab === false, api + ' show_as_tab=false');
  ok(t.parent_api_name === parent && t.parent_kind === kind, api + ' parent=' + kind + ':' + parent);
}
// Slice F (D1 cutover): vendor_integration retired - vendor integrations are
// org-attached record_line rows (line_group=integrations), not a record type.
ok(byApi['vendor_integration'] === undefined, 'vendor_integration retired (Slice F D1 cutover)');
// Existing header_lines corrections intact (Slice A baseline)
ok(byApi['executive_policy']?.structure === 'header_lines', 'policy still header_lines');
ok(byApi['production_product']?.structure === 'header_lines', 'product still header_lines');

// 2. Value sets (rev E §3/§3.3 + rev D Distribution note)
const vsByApi: Record<string, string> = {};
for (const vs of valueSets) vsByApi[vs.api_name] = vs.id;
ok(!!vsByApi['message_type'], 'message_type value set');
ok(!!vsByApi['treasury_transaction_classification'], 'treasury_transaction_classification value set');
ok(!!vsByApi['contact_kind'], 'contact_kind value set');
const itemsOf = (vsApi: string) => valueSetItems.filter((i) => i.value_set_id === vsByApi[vsApi]).map((i) => i.api_value);
ok(JSON.stringify(itemsOf('treasury_transaction_classification')) === JSON.stringify(['income', 'disbursement']), 'classification = income|disbursement');
ok(itemsOf('contact_kind').includes('staff') && itemsOf('contact_kind').includes('public'), 'contact_kind = staff|public');
ok(itemsOf('message_type').length >= 3, 'message_type has items');

// 3. Fields for the 15 objects; picklists wire to locked value sets
for (const [api] of expected) {
  const fields = listFieldDefinitions(api);
  ok(fields.length >= 3, api + ' has fields (' + fields.length + ')');
  ok(fields.some((f) => f.api_name === 'name' && f.is_required), api + ' required name');
}
const vsOf = (obj: string, field: string) => listFieldDefinitions(obj).find((f) => f.api_name === field)?.value_set_api_name;
ok(vsOf('communication_message', 'message_type') === 'message_type', 'message.message_type VS');
ok(vsOf('treasury_transaction', 'classification') === 'treasury_transaction_classification', 'transaction.classification VS');
ok(vsOf('contact', 'contact_kind') === 'contact_kind', 'contact.contact_kind VS');
ok(vsOf('event', 'kind') === 'event_kind', 'event.kind VS (existing set)');
ok(vsOf('knowledge', 'kind') === 'knowledge_kind', 'knowledge.kind VS (existing set)');
ok(vsOf('schedule', 'kind') === 'schedule_kind', 'schedule.kind VS (existing set)');
// list-structure types carry no zone_role placement
ok(listFieldDefinitions('communication_message').every((f) => (f as { zone_role?: string }).zone_role == null), 'communication_message fields have no zone_role');

// 4. Wiring maps + behavior
const tabs = readFileSync('src/lib/zones/record-type-tabs.ts', 'utf8');
ok(tabs.includes('messages: "communication_message"'), 'wiring: messages');
ok(tabs.includes('"promotion-marketing": "dissemination_promotion_marketing"'), 'wiring: promotion-marketing');
ok(tabs.includes('transactions: "treasury_transaction"'), 'wiring: transactions');
ok(tabs.includes('"records-assets-materiel": "treasury_records_assets_materiel"'), 'wiring: RAM');
ok(tabs.includes('"certifications-awards": "qualification_certifications_awards"'), 'wiring: certifications-awards');
ok(tabs.includes('contacts: "contact"'), 'wiring: contacts');
ok(tabs.includes('BAKED_ELEMENT_TAB_SYSTEM_TYPES'), 'element-level wiring map present');
ok(!tabs.includes('integrations: "vendor_integration"'), 'vendor_integration unwired (Slice F D1 cutover)');

const toZone = (t: typeof recordTypes[number]) => ({
  api_name: t.api_name, label: t.label, description: t.description ?? '',
  parent_kind: t.parent_kind, parent_api_name: t.parent_api_name,
  structure: t.structure as 'list' | 'header' | 'header_lines',
  show_as_tab: t.show_as_tab, active: t.active, object_api_name: t.object_api_name ?? t.api_name,
});
const allTypes = recordTypes.map(toZone);

// Division child wiring: communications/messages goes live
const commsTab = {
  id: 'communications', label: 'Communications', summary: 's', fields: [], relations: [],
  children: [
    { id: 'messages', label: 'Messages', summary: 's', fields: [], relations: [] },
    { id: 'reports', label: 'Reports', summary: 's', fields: [], relations: [] },
  ],
} as unknown as Parameters<typeof applyRecordTypesToTab>[0];
const wiredComms = applyRecordTypesToTab(commsTab, 'faculty', allTypes);
const commsKids = (wiredComms as { children?: Array<{ id: string; recordTypeApiName?: string; sampleRows?: string[][] }> }).children ?? [];
ok(commsKids.find((c) => c.id === 'messages')?.recordTypeApiName === 'communication_message', 'messages child wired live');
ok(commsKids.find((c) => c.id === 'messages')?.sampleRows === undefined, 'messages mock rows dropped');
ok(commsKids.find((c) => c.id === 'reports')?.recordTypeApiName === 'communication_report', 'reports child wired live');

// Environment element-level wiring: locations tab itself goes live
const locTab = {
  id: 'locations', label: 'Locations', summary: 's', fields: [], relations: [],
} as unknown as Parameters<typeof applyRecordTypesToTab>[0];
const wiredLoc = applyRecordTypesToTab(locTab, 'environment', allTypes) as { recordTypeApiName?: string; structure?: string; sampleRows?: string[][] };
ok(wiredLoc.recordTypeApiName === 'location', 'locations element tab wired live');
ok(wiredLoc.structure === 'list', 'locations structure=list');
ok(wiredLoc.sampleRows === undefined, 'locations mock rows dropped');
// Unwired tab untouched (collaboration customer has no system type yet)
const custTab = {
  id: 'customer', label: 'Customer', summary: 's', fields: [], relations: [],
} as unknown as Parameters<typeof applyRecordTypesToTab>[0];
const wiredCust = applyRecordTypesToTab(custTab, 'collaboration', allTypes) as { recordTypeApiName?: string };
ok(wiredCust.recordTypeApiName === undefined, 'customer tab untouched (orgs-by-type is Slice D)');

// 5. zone-definitions: division children + Distribution rename
const zd = readFileSync('src/lib/zones/zone-definitions.ts', 'utf8');
for (const cid of ['messages', 'reports', 'staff', 'sales', 'promotion-marketing', 'transactions', 'records-assets-materiel', 'examinations', 'reviews', 'certifications-awards', 'contacts']) {
  ok(zd.includes('id: "' + cid + '"'), 'zone-definitions child ' + cid);
}
ok(zd.includes('label: "Distribution"'), 'Public renamed to Distribution (rev D)');
ok(zd.includes('id: "public"'), 'public tab id retained (C8 namespace stability)');

// 6. selfPanel conditional spread (element-tab live listing)
const zcv = readFileSync('src/components/zones/zone-config-view.tsx', 'utf8');
ok(zcv.includes('#246 Slice C'), 'Slice C marker in zone-config-view');
ok(zcv.includes('...(tab.recordTypeApiName'), 'selfPanel conditional dynamic-path spread');

console.log('SANITY: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
