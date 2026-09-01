'use client';

// #249 Slice E2 (rev E section 4.5 / 2.6 / 3.2, 2026-09-01):
// - DivisionConfigPanel: element_config singleton per division - the appointed
//   staff member in charge (head) + deputy, user lookups saved to
//   PUT /api/element-config/[element]. Rendered on division self panels
//   (Executive keeps its OrganizationsPanel per Gate 3 verdict 2).
// - RecordRelationsPanel: executive one-to-many navigation (section 3.2) -
//   outbound relations (this record -> organizations/records) and inbound
//   relations (sources -> this record) from GET /api/records/[id]/relations,
//   presented both ways on detail pages.

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { theme } from '@/lib/theme';

export interface DivisionConfigShape {
  element_api_name: string;
  head_user_id: string | null;
  deputy_user_id: string | null;
  config: Record<string, unknown>;
}

export interface UserOption {
  id: string;
  name: string;
}

export function DivisionConfigPanel({
  divisionId,
  divisionLabel,
  accent,
}: {
  divisionId: string;
  divisionLabel: string;
  accent?: string;
}) {
  const panelAccent = accent ?? theme.colors.brand;
  const [users, setUsers] = useState<UserOption[]>([]);
  const [headUserId, setHeadUserId] = useState<string>('');
  const [deputyUserId, setDeputyUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/users', { credentials: 'include', signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: Array<{ id: string; name?: string }> }) => {
        setUsers((json.data ?? []).map((u) => ({ id: u.id, name: u.name ?? u.id })));
      })
      .catch(() => setUsers([]));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/element-config/' + encodeURIComponent(divisionId), {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((json: { data?: DivisionConfigShape | null }) => {
        setHeadUserId(json.data?.head_user_id ?? '');
        setDeputyUserId(json.data?.deputy_user_id ?? '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [divisionId]);

  const onSave = async () => {
    setSaving(true);
    setNote('');
    try {
      const res = await fetch('/api/element-config/' + encodeURIComponent(divisionId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          head_user_id: headUserId || null,
          deputy_user_id: deputyUserId || null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setNote(j?.error?.message ?? 'Failed to save division configuration.');
      } else {
        setNote('Division configuration saved.');
      }
    } catch {
      setNote('Failed to save division configuration.');
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm';

  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-6'>
        <p className='text-sm text-muted-foreground'>
          Appointed staff member in charge of the {divisionLabel} division and their deputy
          (rev E section 4.5).
        </p>
        {loading ? (
          <p className='mt-4 text-sm text-muted-foreground'>Loading configuration...</p>
        ) : (
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <label className='space-y-1.5'>
              <span className='text-xs font-medium text-muted-foreground'>Division head</span>
              <select
                className={selectClass}
                value={headUserId}
                onChange={(e) => setHeadUserId(e.target.value)}
              >
                <option value=''>- none -</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className='space-y-1.5'>
              <span className='text-xs font-medium text-muted-foreground'>Deputy</span>
              <select
                className={selectClass}
                value={deputyUserId}
                onChange={(e) => setDeputyUserId(e.target.value)}
              >
                <option value=''>- none -</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <div className='flex items-center gap-3 sm:col-span-2'>
              <button
                type='button'
                onClick={() => void onSave()}
                disabled={saving}
                className='rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60'
                style={{ backgroundColor: panelAccent }}
              >
                {saving ? 'Saving...' : 'Save configuration'}
              </button>
              {note && <span className='text-sm text-muted-foreground'>{note}</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RelationRow {
  id: string;
  direction: 'outbound' | 'inbound';
  target_record_id?: string;
  target_organization_id?: string;
  target_name?: string;
  target_type_label?: string;
  target_kind?: 'record' | 'organization';
  source_record_id?: string;
  source_name?: string;
  source_type_label?: string;
  relation_kind: string;
}

export function RecordRelationsPanel({
  recordId,
  accent,
}: {
  recordId: string;
  accent?: string;
}) {
  const panelAccent = accent ?? theme.colors.brand;
  const [rows, setRows] = useState<RelationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/records/' + encodeURIComponent(recordId) + '/relations', {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { data: { outbound: [], inbound: [] } }))
      .then((json: { data?: { outbound?: RelationRow[]; inbound?: RelationRow[] } }) => {
        setRows([...(json.data?.outbound ?? []), ...(json.data?.inbound ?? [])]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [recordId]);

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-sm text-muted-foreground'>Loading relations...</p>
        </CardContent>
      </Card>
    );
  }

  if (!rows.length) return null;

  const outbound = rows.filter((r) => r.direction === 'outbound');
  const inbound = rows.filter((r) => r.direction === 'inbound');

  return (
    <Card>
      <CardContent className='space-y-4 p-6'>
        <p className='text-sm font-medium'>Relations</p>
        {outbound.length > 0 && (
          <div className='space-y-2'>
            <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Related to
            </p>
            <ul className='space-y-1.5'>
              {outbound.map((r) => (
                <li key={r.id} className='flex flex-wrap items-center gap-2 text-sm'>
                  <span
                    className='rounded px-1.5 py-0.5 text-xs font-medium text-white'
                    style={{ backgroundColor: panelAccent }}
                  >
                    {r.target_kind === 'organization' ? 'Organization' : r.target_type_label || 'Record'}
                  </span>
                  {r.target_kind === 'record' && r.target_record_id ? (
                    <a
                      href={'/records-editor?record=' + encodeURIComponent(r.target_record_id)}
                      className='font-medium underline-offset-2 hover:underline'
                    >
                      {r.target_name}
                    </a>
                  ) : (
                    <span className='font-medium'>{r.target_name}</span>
                  )}
                  <span className='text-xs text-muted-foreground'>{r.relation_kind}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {inbound.length > 0 && (
          <div className='space-y-2'>
            <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Referenced by
            </p>
            <ul className='space-y-1.5'>
              {inbound.map((r) => (
                <li key={r.id} className='flex flex-wrap items-center gap-2 text-sm'>
                  <span
                    className='rounded px-1.5 py-0.5 text-xs font-medium text-white'
                    style={{ backgroundColor: panelAccent }}
                  >
                    {r.source_type_label || 'Record'}
                  </span>
                  <a
                    href={'/records-editor?record=' + encodeURIComponent(r.source_record_id ?? '')}
                    className='font-medium underline-offset-2 hover:underline'
                  >
                    {r.source_name}
                  </a>
                  <span className='text-xs text-muted-foreground'>{r.relation_kind}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
