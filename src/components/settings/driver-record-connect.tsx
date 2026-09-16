"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DRIVER_PAIRING_TYPE,
  findExistingPairing,
  pairingDisplayName,
  pairingFromRecord,
  type ListedRecord,
} from "@/lib/public/driver-pairings";
import { ELEMENT_TYPE_PALETTE, elementTypeById } from "@/lib/public/element-types";

function listUrl(type: string, parentKind: string, parent: string) {
  return `/api/records?type=${encodeURIComponent(type)}&parent_kind=${encodeURIComponent(parentKind)}&parent=${encodeURIComponent(parent)}`;
}

export function DriverRecordConnectPanel({
  driverRecordId,
}: {
  driverRecordId: string;
}) {
  const [driver, setDriver] = useState<ListedRecord | null>(null);
  const [pairings, setPairings] = useState<ListedRecord[]>([]);
  const [records, setRecords] = useState<ListedRecord[]>([]);
  const [recordType, setRecordType] = useState("");
  const [recordId, setRecordId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const compatible = useMemo(() => {
    const raw = String(driver?.data?.compatible_record_type ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ids = raw.length ? raw : ELEMENT_TYPE_PALETTE.map((t) => t.id);
    return ids.map((id) => elementTypeById(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));
  }, [driver]);

  const spec = elementTypeById(recordType) ?? compatible[0];

  const connected = useMemo(
    () =>
      pairings.filter((row) => {
        const fields = pairingFromRecord(row);
        return fields?.driver_id === driverRecordId || fields?.driver_id === String(driver?.data?.code_key ?? "");
      }),
    [pairings, driverRecordId, driver],
  );

  const reload = useCallback(async () => {
    const [drvRes, pairRes] = await Promise.all([
      fetch(`/api/records/${encodeURIComponent(driverRecordId)}`, { credentials: "include" }),
      fetch(listUrl(DRIVER_PAIRING_TYPE, "environment", "custom"), { credentials: "include" }),
    ]);
    const drvJson = drvRes.ok ? await drvRes.json() : {};
    const pairJson = pairRes.ok ? await pairRes.json() : { data: [] };
    const drv = (drvJson.data ?? drvJson) as ListedRecord;
    setDriver(drv);
    setPairings((pairJson.data ?? []) as ListedRecord[]);
  }, [driverRecordId]);

  useEffect(() => {
    void reload().catch(() => setError("Could not load connected records."));
  }, [reload]);

  useEffect(() => {
    if (!spec) return;
    let cancelled = false;
    void fetch(listUrl(spec.recordType, spec.parentKind, spec.parentApiName), { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        if (cancelled) return;
        const rows = ((json.data ?? []) as ListedRecord[]).filter((r) => r.status !== "archived");
        setRecords(rows);
        setRecordId((cur) => cur || rows[0]?.id || "");
      })
      .catch(() => {
        if (!cancelled) setRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [spec]);

  useEffect(() => {
    if (!recordType && compatible[0]) setRecordType(compatible[0].id);
  }, [compatible, recordType]);

  const connect = async () => {
    if (!spec || !recordId || !driver) {
      setError("Pick a record to connect.");
      return;
    }
    if (findExistingPairing(pairings, spec.recordType, recordId, driverRecordId)) {
      setError("That record is already connected to this driver.");
      return;
    }
    setBusy(true);
    setError(null);
    const recordName = records.find((r) => r.id === recordId)?.name ?? recordId;
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_api_name: DRIVER_PAIRING_TYPE,
          parent_kind: "environment",
          parent_api_name: "custom",
          name: pairingDisplayName(driver.name || String(driver.data?.code_key ?? "Driver"), recordName),
          status: "active",
          data: {
            driver_id: driverRecordId,
            target_record_type: spec.recordType,
            target_record_id: recordId,
            target_kind: "header",
            input_map_json: "{}",
            record_mode: "single",
            filter_json: "[]",
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "Could not connect that record.");
        setBusy(false);
        return;
      }
      await reload();
    } catch {
      setError("Could not connect that record.");
    }
    setBusy(false);
  };

  const disconnect = async (pairingId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/records/${encodeURIComponent(pairingId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "Could not disconnect. Unbind the Cell first if it still uses this config.");
        setBusy(false);
        return;
      }
      await reload();
    } catch {
      setError("Could not disconnect that record.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <div>
        <p className="text-sm font-medium">Connected records</p>
        <p className="text-xs text-muted-foreground">
          Bind a live record to this driver here. The canvas drops a recipe; it does not search records.
        </p>
      </div>
      {connected.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records connected yet.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {connected.map((row) => {
            const fields = pairingFromRecord(row);
            const typeLabel = elementTypeById(fields?.target_record_type)?.label ?? fields?.target_record_type;
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {row.name || row.id}
                  <span className="ml-2 text-xs text-muted-foreground">{typeLabel}</span>
                </span>
                <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void disconnect(row.id)}>
                  Disconnect
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[10rem] flex-1 text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Record type</span>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={spec?.id ?? ""}
            onChange={(e) => {
              setRecordType(e.target.value);
              setRecordId("");
            }}
          >
            {compatible.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[12rem] flex-[2] text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Record</span>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
          >
            {records.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name || row.id}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" size="sm" disabled={busy || !recordId} onClick={() => void connect()}>
          Connect
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
