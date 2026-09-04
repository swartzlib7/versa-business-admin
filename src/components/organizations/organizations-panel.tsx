'use client';

// #248 Slice D (rev E section 4.3 / section 2.7 / C6, 2026-08-31):
// - OrganizationsPanel: the Executive organizations list. Full CRUD on the
//   typed core platform table. There is one Org-type record (the Primary Org).
// - OrgTypeListingPanel: Collaboration zone rendering (C6) - one organization
//   type per tab (vendor/customer/partner/branch). Branch filters by the
//   Primary Org (parent_organization_id).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EntityListing, type ListingField } from '@/components/listing/entity-listing';
import { theme } from '@/lib/theme';
import type { Organization, OrgType } from '@/lib/data/types';
import { primaryOrganization } from '@/lib/organizations/primary-org';

const ORG_TYPES: OrgType[] = ['internal', 'vendor', 'customer', 'partner', 'branch'];
const ORG_TYPE_LABELS: Record<OrgType, string> = {
  internal: 'Org',
  vendor: 'Vendor',
  customer: 'Customer',
  partner: 'Partner',
  branch: 'Branch',
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

function usePrimaryOrgId() {
  const { orgs } = useOrganizations();
  return primaryOrganization(orgs)?.id ?? '';
}

export function PrimaryOrgPanel({ accent }: { accent?: string }) {
  const panelAccent = accent ?? theme.colors.brand;
  const { orgs, loading, error } = useOrganizations();
  const primary = primaryOrganization(orgs);

  if (loading) return <LoadingCard label="Loading primary organization..." />;
  if (error) return <ErrorCard message={error} />;

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div>
          <p className="text-sm font-medium">Primary Org</p>
          <p className="text-sm text-muted-foreground">
            The single Org-type record this Mission Control belongs to. All records
            carry its org_id. This flag is set once and cannot be changed.
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          {primary ? (
            <span>
              <span className="font-medium">{primary.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">Primary · Org</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              No Primary Org yet. Create one organization of type Org on the Executive tab.
              The first Org becomes Primary and cannot be changed.
            </span>
          )}
        </div>
        <span className="sr-only" style={{ color: panelAccent }}>
          {primary?.id}
        </span>
      </CardContent>
    </Card>
  );
}

/** Collaboration tabs list only orgs of that type. Branch also filters to the Primary Org's children. */
function filterByOrgType(orgs: Organization[], orgType: OrgType, defaultOrgId: string): Organization[] {
  const ofType = orgs.filter((o) => o.org_type === orgType);
  if (orgType === 'branch' && defaultOrgId) {
    return ofType.filter((o) => o.parent_organization_id === defaultOrgId);
  }
  return ofType;
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

function orgFields(
  orgs: Organization[],
  opts: { includeType?: boolean; includeParent?: boolean },
): ListingField[] {
  const fields: ListingField[] = [
    { key: 'name', label: 'Name', kind: 'text' },
  ];
  if (opts.includeType) {
    fields.push({
      key: 'org_type',
      label: 'Organization type',
      kind: 'select',
      options: [...ORG_TYPES],
      optionLabels: ORG_TYPES.map((t) => ORG_TYPE_LABELS[t]),
    });
  }
  if (opts.includeParent) {
    fields.push({
      key: 'parent_organization_id',
      label: 'Parent Org',
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
  const [note, setNote] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | OrgType>('');
  const hasPrimary = orgs.some((o) => o.org_type === 'internal');
  const fields = useMemo(() => orgFields(orgs, { includeType: true, includeParent: true }), [orgs]);
  const rows = useMemo(
    () => (typeFilter ? orgs.filter((o) => o.org_type === typeFilter) : orgs),
    [orgs, typeFilter],
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
        org_type: draft.org_type || (hasPrimary ? 'vendor' : 'internal'),
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
      <EntityListing<Organization & Record<string, unknown>>
        summary='Organization records. There is one Org (the Primary Org). Vendors, customers, partners, and branches are other organizations.'
        accent={panelAccent}
        columnStorageKey="mc.listing.orgs"
        fields={fields}
        rows={rows as unknown as (Organization & Record<string, unknown>)[]}
        getRowId={(o) => o.id}
        getCell={(o, key) => orgCell(o, key, orgs)}
        formatCell={(o, key, raw) => orgFormat(o, key, raw, orgs)}
        headerFilters={
          <label className='flex items-center gap-2 text-sm'>
            <span className='text-xs font-medium text-muted-foreground'>Filter by type</span>
            <select
              className='border-input bg-background rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
              value={typeFilter}
              onChange={(e) => setTypeFilter((e.target.value || '') as '' | OrgType)}
            >
              <option value=''>All types</option>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ORG_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        }
        headerExtra={note ? <span className='text-xs text-muted-foreground'>{note}</span> : null}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={(id) => {
          void (async () => {
            const res = await fetch('/api/organizations/' + id, {
              method: 'DELETE',
              credentials: 'include',
            });
            if (!res.ok) {
              const j = await res.json().catch(() => null);
              setNote(j?.error?.message ?? 'Failed to delete organization.');
              return;
            }
            setNote('Organization deleted.');
            reload();
          })();
        }}
        deleteTitle='Delete this organization?'
        deleteDescription='This permanently deletes the organization and any child branches. Attached integration lines are also removed. The Primary Org cannot be deleted. This cannot be undone.'
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
  const primaryOrgId = usePrimaryOrgId();
  const [note, setNote] = useState('');
  const fields = useMemo(
    () => orgFields(orgs, { includeParent: orgType === 'branch' }),
    [orgs, orgType],
  );
  const rows = useMemo(
    () => filterByOrgType(orgs, orgType, primaryOrgId),
    [orgs, orgType, primaryOrgId],
  );

  const onAdd = async (draft: Record<string, string>) => {
    const name = (draft.name ?? '').trim();
    if (!name) {
      setNote('Name is required.');
      return false;
    }
    const parentId =
      orgType === 'branch'
        ? draft.parent_organization_id || primaryOrgId || null
        : draft.parent_organization_id || null;
    if (orgType === 'branch' && !parentId) {
      setNote('Parent Org is required for a Branch. The Primary Org is used when no parent is chosen.');
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
        parent_organization_id: parentId,
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
        ...(orgType === 'branch'
          ? { parent_organization_id: draft.parent_organization_id || primaryOrgId || null }
          : {}),
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

  const onDelete = (id: string) => {
    void (async () => {
      const res = await fetch('/api/organizations/' + id, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setNote(j?.error?.message ?? 'Failed to delete organization.');
        return;
      }
      setNote(ORG_TYPE_LABELS[orgType] + ' organization deleted.');
      reload();
    })();
  };

  if (loading) return <LoadingCard label={'Loading ' + ORG_TYPE_LABELS[orgType].toLowerCase() + ' organizations...'} />;
  if (error) return <ErrorCard message={error} />;

  return (
    <div className='space-y-3'>
      <EntityListing<Organization & Record<string, unknown>>
        summary={summary ?? 'Organizations of this type.'}
        accent={panelAccent}
        fields={fields}
        rows={rows as unknown as (Organization & Record<string, unknown>)[]}
        getRowId={(o) => o.id}
        getCell={(o, key) => orgCell(o, key, orgs)}
        formatCell={(o, key, raw) => orgFormat(o, key, raw, orgs)}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        deleteTitle={'Delete this ' + ORG_TYPE_LABELS[orgType].toLowerCase() + '?'}
        deleteDescription={
          orgType === 'branch'
            ? 'This permanently deletes the branch. Attached integration lines are also removed. This cannot be undone.'
            : 'This permanently deletes the organization and any child branches. Attached integration lines are also removed. This cannot be undone.'
        }
        emptyLabel={'No ' + ORG_TYPE_LABELS[orgType].toLowerCase() + ' organizations yet.'}
        columnStorageKey={`mc.listing.orgs.${orgType}`}
      />
      {note && <p className='pt-2 text-xs text-muted-foreground'>{note}</p>}
    </div>
  );
}
