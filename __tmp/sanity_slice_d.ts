// #248 Slice D sanity — structural assertions (no DB). Run: npx tsx __tmp/sanity_slice_d.ts
import { readFileSync, existsSync } from 'fs';
let pass = 0, fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); }
}
const rd = (p: string) => readFileSync(p, 'utf8');

// 1. Migration
const mig = rd('drizzle/0001_i5_6_33_slice_d_organizations_extension.sql');
ok(mig.includes('ADD COLUMN "is_person" boolean'), 'migration adds is_person');
ok(mig.includes("ADD COLUMN \"org_type\" text DEFAULT 'internal'"), 'migration adds org_type default internal');
ok(mig.includes('ADD COLUMN "parent_organization_id" text'), 'migration adds parent_organization_id');
ok(mig.includes('REFERENCES "public"."organizations"("id")'), 'migration FK to organizations.id');
ok(mig.includes("('vendor', 'customer', 'partner', 'branch', 'internal')"), 'migration CHECK org_type VS');

// 2. Schema
const schema = rd('src/lib/db/schema.ts');
ok(schema.includes("isPerson: boolean('is_person')"), 'schema isPerson');
ok(schema.includes("orgType: text('org_type')"), 'schema orgType');
ok(schema.includes('parentOrganizationId: text('), 'schema parentOrganizationId');
ok(schema.includes('organizations_org_type_check'), 'schema check constraint');

// 3. Types
const types = rd('src/lib/data/types.ts');
ok(types.includes('export type OrgType = "vendor" | "customer" | "partner" | "branch" | "internal"'), 'OrgType union');
ok(types.includes('is_person: boolean;'), 'Organization.is_person');
ok(types.includes('org_type: OrgType;'), 'Organization.org_type');
ok(types.includes('parent_organization_id?: string | null;'), 'Organization.parent_organization_id');
ok(types.includes('CreateOrganizationInput'), 'CreateOrganizationInput');
ok(types.includes('UpdateOrganizationInput'), 'UpdateOrganizationInput');

// 4. Adapter
const adapter = rd('src/lib/data/adapter.ts');
ok(adapter.includes('listOrganizations?'), 'adapter listOrganizations');
ok(adapter.includes('getOrganization?'), 'adapter getOrganization');
ok(adapter.includes('createOrganization?'), 'adapter createOrganization');
ok(adapter.includes('updateOrganization?'), 'adapter updateOrganization');
ok(adapter.includes('default_organization_id?: string | null;'), 'user default_organization_id');
ok(rd("src/lib/db/postgres-adapter.ts").includes("mapOrganizationRow"), "postgres adapter org row mapper");

// 5. Zone definitions
const zones = rd('src/lib/zones/zone-definitions.ts');
for (const t of ['vendor', 'customer', 'partner', 'branch']) {
  ok(zones.includes('orgTypePanel: "' + t + '"'), 'collab tab wired: ' + t);
}
ok(!zones.includes('sampleRows: ["Cloudflare"'), 'vendor mock removed');
ok(!zones.includes('sampleRows: ["Acme Ltd"'), 'customer mock removed');
ok(!zones.includes('sampleRows: ["Northwind Ventures"'), 'partner mock removed');
ok(!zones.includes('sampleRows: ["Southeast hub"'), 'branch mock removed');
ok(zones.includes('id: "executive"'), 'executive zone present');

// 6. Zone config view wiring
const zcv = rd('src/components/zones/zone-config-view.tsx');
ok(zcv.includes('orgTypePanel ? (') && zcv.includes('<OrgTypeListingPanel'), 'TabPanel orgType special-case');
ok(zcv.includes('isOrganizationsSelf ? (') && zcv.includes('<OrganizationsPanel'), 'Executive organizations self panel');
ok(zcv.includes('[tab, isOrganizationsSelf]'), 'selfPanel memo deps complete');
ok(zcv.includes('import { OrganizationsPanel, OrgTypeListingPanel }'), 'panel import');

// 7. Panel behavior
const panel = rd('src/components/organizations/organizations-panel.tsx');
ok(panel.includes("if (orgType === 'branch') {"), 'branch filters by parent');
ok(panel.includes('o.parent_organization_id === defaultOrgId'), 'branch parent match');
ok(panel.includes("if (!defaultOrgId) return orgs;"), 'no default org = unfiltered');
ok(panel.includes("key: 'is_person'"), 'is_person column');
ok(panel.includes('org_type: orgType'), 'create stamps tab org_type');
ok(panel.includes('Promise.resolve().then(reload)'), 'deferred initial load');
ok(panel.includes('default_organization_id'), 'default org persistence');
ok(panel.includes('PATCH'), 'PATCH used for user setting');

// 8. API routes
ok(existsSync('src/app/api/organizations/route.ts'), 'organizations route');
ok(existsSync('src/app/api/organizations/[id]/route.ts'), 'organizations [id] route');

console.log('sanity_slice_d: ' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
