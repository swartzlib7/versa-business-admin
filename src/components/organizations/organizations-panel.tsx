'use client';

// #248 Slice D (rev E section 4.3 / section 2.7 / C6, 2026-08-31):
// - OrganizationsPanel: the Executive organizations list (Gate 3 verdict 2 -
//   the list replaces the Executive header/config form). Full CRUD on the
//   typed core platform table + the user-level default organization setting
//   (section 2.5) persisted on the signed-in user via PATCH /api/users/:id.
// - OrgTypeListingPanel: Collaboration zone rendering (C6) - one organization
//   type per tab (vendor/customer/partner/branch). Branch filters by the
//   user's default organization (parent_organization_id); vendor/customer/
//   partner show all of the type because section 4.3 reserves
//   parent_organization_id for branches (set => branch), so no ownership
//   carrier exists for them until record.org_id lands (Slice E2). FLAGGED
//   to COA in the Gate 1 report.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EntityListing, type ListingField } from '@/components/listing/entity-listing';
import { theme } from '@/lib/theme';
import type { Organization, OrgType } from '@/lib/data/types';

const ORG_TYPES: OrgType[] = ['vendor', 'customer', 'partner', 'branch', 'internal'];
const ORG_TYPE_LABELS: Record<OrgType, string> = {
  vendor: 'Vendor',
  customer: 'Customer',
  partner: 'Partner',
  branch: 'Branch',
  internal: 'Internal',
};

/** Load all organizations (typed core table, /api/organizations). */
function useOrganizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    setLoading(true);
    fetch('/api/organizations')
      .then((r) => {
        if (!r.ok) throw new Error('Not authorized - please sign in.');
        return r.json();
      })
      .then((json) => {
        setOrgs(json.data ?? []);
        setLoading(false);
        setError('');
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load organizations.');
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    // Defer to a microtask: reload() sets state synchronously, which the
    // set-state-in-effect rule forbids inside the effect body itself.
    void Promise.resolve().then(reload);
  }, [reload]);
  return { orgs, loading, error, reload };
}

/** Resolve + persist the signed-in user's default organization (section 2.5). */
function useDefaultOrganization() {
  const [defaultOrgId, setDefaultOrgId] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(async (json) => {
        const userId = json?.data?.userId as string | undefined;
        if (!userId || cancelled) return;
        const res = await fetch('/api/users');
        if (!res.ok || cancelled) return;
        const payload = await res.json();
        const self = (payload.data ?? []).find((u: { id: string }) => u.id === userId);
        if (!cancelled && self) {
          const data = (self.data ?? {}) as Record<string, unknown>;
          setDefaultOrgId(typeof data.default_organization_id === 'string' ? data.default_organization_id : '');
        }
      })
      .catch(() => {
        /* unsigned or unavailable - no default-org filter */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const saveDefault = useCallback(async (orgId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/session');
      const json = await res.json();
      const userId = json?.data?.userId as string | undefined;
      if (!userId) return false;
      const patch = await fetch('/api/users/' + userId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ default_organization_id: orgId || null }),
      });
      if (!patch.ok) return false;
      setDefaultOrgId(orgId);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, []);
  return { defaultOrgId, saveDefault, saving };
}

/** C6 default-org filter. Branch: parent_organization_id = default org.
 *  Vendor/customer/partner: unfiltered (see component header note). */
function filterByDefaultOrg(orgs: Organization[], orgType: OrgType, defaultOrgId: string): Organization[] {
  if (!defaultOrgId) return orgs;
  if (orgType === 'branch') {
    return orgs.filter((o) => o.parent_organization_id === defaultOrgId);
  }
  return orgs;
}

function LoadingCard({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
        <p className='text-sm text-muted-foreground'>{label}</p>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
        <p className='text-sm font-medium text-destructive'>{message}</p>
        <p className='mt-1 text-sm text-muted-foreground'>Please sign in to view organizations.</p>
      </CardContent>
    </Card>
  );
}

function orgFields(orgs: Organization[], includeTypeAndParent: boolean): ListingField[] {
  const fields: ListingField[] = [
    { key: 'name', label: 'Name', kind: 'text' },
  ];
  if (includeTypeAndParent) {
    fields.push({
      key: 'org_type',
      label: 'Organization type',
      kind: 'select',
      options: [...ORG_TYPES],
      optionLabels: ORG_TYPES.map((t) => ORG_TYPE_LABELS[t]),
    });
    fields.push({
      key: 'parent_organization_id',
      label: 'Parent organization',
      kind: 'select',
      options: orgs.map((o) => o.id),
      optionLabels: orgs.map((o) => o.name),
    });
  }
  fields.push({ key: 'is_person', label: 'Person organization', kind: 'boolean' });
  return fields;
}

function orgCell(row: Organization, key: string, orgs: Organization[]): string {
  switch (key) {
    case 'name':
      return row.name;
    case 'org_type':
      return row.org_type;
    case 'is_person':
      return row.is_person ? 'true' : 'false';
    case 'parent_organization_id': {
      if (!row.parent_organization_id) return '';
      const parent = orgs.find((o) => o.id === row.parent_organization_id);
      return parent ? parent.id : row.parent_organization_id;
    }
    default:
      return '';
  }
}

function orgFormat(row: Organization, key: string, raw: string, orgs: Organization[]): string {
  if (key === 'org_type' && raw) return ORG_TYPE_LABELS[raw as OrgType] ?? raw;
  if (key === 'is_person') return raw === 'true' ? 'Yes' : 'No';
  if (key === 'parent_organization_id' && raw) {
    const parent = orgs.find((o) => o.id === raw);
    return parent ? parent.name : raw;
  }
  return raw;
}

/** Executive organizations list (self panel replacement, Gate 3 verdict 2). */
export function OrganizationsPanel({ accent }: { accent?: string }) {
  const panelAccent = accent ?? theme.colors.brand;
  const { orgs, loading, error, reload } = useOrganizations();
  const { defaultOrgId, saveDefault, saving } = useDefaultOrganization();
  const [note, setNote] = useState('');
  const fields = useMemo(() => orgFields(orgs, true), [orgs]);

  const onAdd = async (draft: Record<string, string>) => {
    const name = (draft.name ?? '').trim();
    if (!name) {
      setNote('Name is required.');
      return false;
    }
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        org_type: draft.org_type || 'internal',
        is_person: draft.is_person === 'true',
        parent_organization_id: draft.parent_organization_id || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setNote(j?.error?.message ?? 'Failed to create organization.');
      return false;
    }
    setNote('Organization created.');
    reload();
    return true;
  };

  const onUpdate = async (id: string, draft: Record<string, string>) => {
    const res = await fetch('/api/organizations/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: (draft.name ?? '').trim() || undefined,
        org_type: draft.org_type || undefined,
        is_person: draft.is_person === 'true',
        parent_organization_id: draft.parent_organization_id || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setNote(j?.error?.message ?? 'Failed to update organization.');
      return false;
    }
    setNote('Organization updated.');
    reload();
    return true;
  };

  if (loading) return <LoadingCard label='Loading organizations...' />;
  if (error) return <ErrorCard message={error} />;

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <label className='flex items-center gap-2'>
          <span className='text-xs font-medium text-muted-foreground'>Default organization</span>
          <select
            className='border-input bg-background rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
            value={defaultOrgId}
            disabled={saving}
            onChange={(e) => void saveDefault(e.target.value)}
          >
            <option value=''>Select…</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <span className='text-xs text-muted-foreground'>
          User-level setting (rev E section 2.5) - filters Collaboration entries (C6) and presets new records from Slice E2.
        </span>
      </div>
      <EntityListing<Organization & Record<string, unknown>>
        summary='All organizations - the typed core platform table (rev E section 4.3). Tenant root for every content record.'
        accent={panelAccent}
        fields={fields}
        rows={orgs as unknown as (Organization & Record<string, unknown>)[]}
        getRowId={(o) => o.id}
        getCell={(o, key) => orgCell(o, key, orgs)}
        formatCell={(o, key, raw) => orgFormat(o, key, raw, orgs)}
        onAdd={onAdd}
        onUpdate={onUpdate}
        emptyLabel='No organizations yet.'
      />
      {note && <p className='pt-2 text-xs text-muted-foreground'>{note}</p>}
    </div>
  );
}

/** Collaboration zone rendering (C6): one organization type per tab. */
export function OrgTypeListingPanel({
  orgType,
  accent,
  summary,
}: {
  orgType: 'vendor' | 'customer' | 'partner' | 'branch';
  accent?: string;
  summary?: string;
}) {
  const panelAccent = accent ?? theme.scene.collaborationColor ?? theme.colors.brand;
  const { orgs, loading, error, reload } = useOrganizations();
  const { defaultOrgId } = useDefaultOrganization();
  const [note, setNote] = useState('');
  const fields = useMemo(() => orgFields(orgs, false), [orgs]);
  const rows = useMemo(
    () => filterByDefaultOrg(orgs, orgType, defaultOrgId),
    [orgs, orgType, defaultOrgId],
  );

  const onAdd = async (draft: Record<string, string>) => {
    const name = (draft.name ?? '').trim();
    if (!name) {
      setNote('Name is required.');
      return false;
    }
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        org_type: orgType,
        is_person: draft.is_person === 'true',
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setNote(j?.error?.message ?? 'Failed to create organization.');
      return false;
    }
    setNote(ORG_TYPE_LABELS[orgType] + ' organization created.');
    reload();
    return true;
  };

  const onUpdate = async (id: string, draft: Record<string, string>) => {
    const res = await fetch('/api/organizations/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: (draft.name ?? '').trim() || undefined,
        is_person: draft.is_person === 'true',
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setNote(j?.error?.message ?? 'Failed to update organization.');
      return false;
    }
    setNote('Organization updated.');
    reload();
    return true;
  };

  if (loading) return <LoadingCard label={'Loading ' + ORG_TYPE_LABELS[orgType].toLowerCase() + ' organizations...'} />;
  if (error) return <ErrorCard message={error} />;

  return (
    <div className='space-y-3'>
      <EntityListing<Organization & Record<string, unknown>>
        summary={summary ?? 'Organizations rendered by type (rev E section 2.7 / C6).'}
        accent={panelAccent}
        fields={fields}
        rows={rows as unknown as (Organization & Record<string, unknown>)[]}
        getRowId={(o) => o.id}
        getCell={(o, key) => orgCell(o, key, orgs)}
        formatCell={(o, key, raw) => orgFormat(o, key, raw, orgs)}
        onAdd={onAdd}
        onUpdate={onUpdate}
        emptyLabel={'No ' + ORG_TYPE_LABELS[orgType].toLowerCase() + ' organizations yet.'}
      />
      {note && <p className='pt-2 text-xs text-muted-foreground'>{note}</p>}
    </div>
  );
}
