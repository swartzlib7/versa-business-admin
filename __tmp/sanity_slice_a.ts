// #185 Slice A sanity — rev E §7.2/§7.3/§4.2 fixture-level assertions
import { readFileSync } from 'fs';
import { recordTypes } from '../src/lib/fixtures/record-types';
import { listFieldDefinitions } from '../src/lib/fixtures/catalog';
import {
  createInstance,
  updateInstance,
  getInstance,
  resetRecordInstances,
} from '../src/lib/fixtures/record-instances';
import { applyRecordTypesToTab } from '../src/lib/zones/record-type-tabs';

let pass = 0, fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); }
}

// 1. Structure corrections (rev E §7.2)
const struct: Record<string, string> = {};
for (const t of recordTypes) struct[t.api_name] = t.structure;
ok(struct['executive_policy'] === 'header_lines', 'policy header_lines');
ok(struct['executive_project'] === 'header_lines', 'project header_lines');
ok(struct['executive_task'] === 'header_lines', 'task header_lines');
ok(struct['production_product'] === 'header_lines', 'product header_lines');
ok(struct['production_service'] === 'header_lines', 'service header_lines');
ok(struct['vendor_integration'] === undefined, 'vendor_integration retired (Slice F D1 cutover)');

// 2. Catalog re-roling: existing fields = header; line fields = list + show_in_column
for (const obj of ['executive_project', 'executive_task', 'production_product', 'production_service']) {
  const fields = listFieldDefinitions(obj);
  ok(fields.length > 0, obj + ' has fields');
  const headerFields = fields.filter((f) => (f as { zone_role?: string }).zone_role === 'header');
  const listFields = fields.filter((f) => (f as { zone_role?: string }).zone_role === 'list');
  ok(headerFields.length >= 3, obj + ' header fields re-roled (' + headerFields.length + ')');
  ok(listFields.length >= 2, obj + ' line fields seeded (' + listFields.length + ')');
  ok(listFields.every((f) => (f as { show_in_column?: boolean }).show_in_column === true), obj + ' line fields show_in_column');
  ok(headerFields.every((f) => (f as { show_in_column?: boolean }).show_in_column !== true), obj + ' header fields not columns');
}
// policy unchanged
const policyFields = listFieldDefinitions('executive_policy');
ok(policyFields.filter((f) => (f as { zone_role?: string }).zone_role === 'list').length >= 2, 'policy line fields intact');
// line group prefixes
const projList = listFieldDefinitions('executive_project').filter((f) => (f as { zone_role?: string }).zone_role === 'list');
ok(projList[0].api_name.startsWith('milestone_'), 'project lines = milestones');
const taskList = listFieldDefinitions('executive_task').filter((f) => (f as { zone_role?: string }).zone_role === 'list');
ok(taskList[0].api_name.startsWith('subtask_'), 'task lines = subtasks');
const prodList = listFieldDefinitions('production_product').filter((f) => (f as { zone_role?: string }).zone_role === 'list');
ok(prodList[0].api_name.startsWith('variant_'), 'product lines = variants');
const servList = listFieldDefinitions('production_service').filter((f) => (f as { zone_role?: string }).zone_role === 'list');
ok(servList[0].api_name.startsWith('rate_'), 'service lines = rate lines');

// 3. Fixture lines model: wrapped lines with line_group (rev E §4.2)
resetRecordInstances();
const created = createInstance({
  type_api_name: 'executive_project',
  parent_kind: 'faculty',
  parent_api_name: 'executive',
  name: 'Test Project',
  status: 'active',
  data: { owner: 'Stephen' },
  lines: [{ line_group: 'milestones', data: { milestone_title: 'Kickoff', milestone_date: '2026-09-01' } }],
});
ok(created.ok === true, 'create with wrapped lines ok');
if (created.ok) {
  const inst = getInstance(created.instance.id);
  ok(!!inst, 'created instance readable');
  ok(inst?.lines?.length === 1, 'one line stored');
  ok(inst?.lines?.[0]?.line_group === 'milestones', 'line_group persisted');
  ok(inst?.lines?.[0]?.data['milestone_title'] === 'Kickoff', 'line data persisted');
  const upd = updateInstance(created.instance.id, {
    lines: [
      { line_group: 'milestones', data: { milestone_title: 'Kickoff v2', milestone_date: '2026-09-02' } },
      { line_group: 'milestones', data: { milestone_title: 'Beta', milestone_date: '2026-09-15' } },
    ],
  });
  ok(upd.ok === true, 'update with wrapped lines ok');
  const after = getInstance(created.instance.id);
  ok(after?.lines?.length === 2, 'two lines after update');
  ok(after?.lines?.[1]?.line_group === 'milestones', 'updated line_group persisted');
}

// 4. Baked tab wiring carries header_lines structure (list→detail precondition)
const fakeTab = {
  id: 'executive',
  label: 'Executive',
  summary: 's',
  fields: [],
  relations: [],
  children: [
    { id: 'policy', label: 'Policy', summary: 's', fields: [], relations: [] },
    { id: 'projects', label: 'Projects', summary: 's', fields: [], relations: [] },
    { id: 'tasks', label: 'Tasks', summary: 's', fields: [], relations: [] },
  ],
} as unknown as Parameters<typeof applyRecordTypesToTab>[0];
const wired = applyRecordTypesToTab(fakeTab, 'faculty', recordTypes.map((t) => ({
  api_name: t.api_name, label: t.label, description: t.description ?? '',
  parent_kind: t.parent_kind, parent_api_name: t.parent_api_name,
  structure: t.structure as 'list' | 'header' | 'header_lines',
  show_as_tab: t.show_as_tab, active: t.active, object_api_name: t.object_api_name ?? t.api_name,
})));
const kids = (wired as { children?: Array<{ id: string; structure?: string }> }).children ?? [];
const byId: Record<string, string | undefined> = {};
for (const c of kids) byId[c.id] = c.structure;
ok(byId['policy'] === 'header_lines', 'wired policy header_lines');
ok(byId['projects'] === 'header_lines', 'wired projects header_lines');
ok(byId['tasks'] === 'header_lines', 'wired tasks header_lines');

// 5. #247 Slice B (Gate 3 amendment): policy renders list-to-detail like the
// other header_lines types - no executive_policy exclusion remains.
const zcv = readFileSync('src/components/zones/zone-config-view.tsx', 'utf8');
ok(!zcv.includes('panel.recordTypeApiName !== "executive_policy"'), 'policy exclusion removed from isListToDetail');
ok(zcv.includes('const isListToDetail = isHeaderLines && panel.recordTypeApiName != null;'), 'list-to-detail gate universal for header_lines');
ok(zcv.includes('#247 Slice B'), 'Slice B marker present in zone-config-view');
ok(struct['executive_policy'] === 'header_lines', 'policy still header_lines (rendering precondition)');
const policyListFields = listFieldDefinitions('executive_policy').filter((f) => (f as { zone_role?: string }).zone_role === 'list');
ok(policyListFields.length >= 2, 'policy line fields still seeded for detail lines panel');

console.log('SANITY: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
