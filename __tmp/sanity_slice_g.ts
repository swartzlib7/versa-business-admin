// #250 Slice G sanity - structural assertions (no DB). Final integration pass.
// Run: npx tsx __tmp/sanity_slice_g.ts
import { readFileSync } from 'fs';
let pass = 0, fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); }
}
const rd = (p: string) => readFileSync(p, 'utf8');

// 1. Item 1 - hub element height fill to viewport bottom
const dash = rd('src/app/dashboard/page.tsx');
ok(dash.includes('"flex min-h-0 w-full flex-1 flex-col overflow-visible"'), 'item1: scene Card grows (flex min-h-0 flex-1)');
ok(dash.includes('<CardContent className="flex min-h-0 flex-1 flex-col pt-0">'), 'item1: CardContent flex column');
ok(dash.includes('className="min-h-[375px] w-full flex-1"'), 'item1: scene fills parent, 375px floor kept');
ok(!dash.includes('className="h-[375px] w-full"'), 'item1: hardcoded h-[375px] removed');

// 2. Item 6 - Records Editor field-form UX
const re = rd('src/components/settings/records-editor.tsx');
ok(re.includes('const DATA_TYPES: SelectOption[] = ['), 'item6: DATA_TYPES labeled options');
ok(re.includes('group: "Text"') && re.includes('group: "Choice"') && re.includes('group: "Relation"'), 'item6: data types grouped');
ok(re.includes('label: "Picklist (single choice)"') && re.includes('label: "Multi-picklist (multiple choices)"'), 'item6: picklist naming clarified');
const vsLine = re.split('\n').find((l) => l.includes('key: "value_set_api_name"')) || '';
const loLine = re.split('\n').find((l) => l.includes('key: "lookup_object_api_name"')) || '';
ok(vsLine.includes('showWhen') && vsLine.includes('picklist'), 'item6: Value set conditional on picklist/multipicklist');
ok(loLine.includes('showWhen') && loLine.includes('"lookup"'), 'item6: Lookup object conditional on lookup');
ok(re.includes('vals.data_type === "picklist" || vals.data_type === "multipicklist" ? (vals.value_set_api_name || null) : null'), 'item6: createField nulls stale value_set');
ok(re.includes('vals.data_type === "lookup" ? (vals.lookup_object_api_name || null) : null'), 'item6: createField nulls stale lookup_object');

// 3. Items 7/8/9 - Configuration -> Records renames (ids stay "configuration")
const glo = rd('src/app/glossary/page.tsx');
const usr = rd('src/app/users/page.tsx');
ok((glo.match(/id: "configuration", label: "Records"/g) || []).length === 2, 'item7: glossary 2 labels renamed');
ok(!glo.includes('label: "Configuration"'), 'item7: glossary zero Configuration labels');
ok((usr.match(/id: "configuration", label: "Records"/g) || []).length === 1, 'item8: users 1 label renamed');
ok(!usr.includes('label: "Configuration"'), 'item8: users zero Configuration labels');
ok((re.match(/id: "configuration", label: "Records"/g) || []).length === 4, 'item9: records-editor 4 labels renamed');
ok(!re.includes('label: "Configuration"'), 'item9: records-editor zero Configuration labels');

// 4. Version bump
const pkg = JSON.parse(rd('package.json'));
ok(pkg.version === '0.7.71', 'version bumped to 0.7.71');

// 5. Docs - living state doc carries Slice G delivery record
const st = rd('docs/design/spec/state/state_i5_6_zone_erd.md');
ok(st.includes('Slice G delivery'), 'docs: Slice G delivery section present');
ok(st.includes('0.7.71'), 'docs: version bump recorded');

console.log('Slice G sanity: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
