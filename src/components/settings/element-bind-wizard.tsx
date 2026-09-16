"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ELEMENT_TYPE_PALETTE,
  RECORD_OUTPUTS_BY_TYPE,
  elementTypeById,
  type ElementTypeId,
} from "@/lib/public/element-types";
import {
  DRIVER_PAIRING_TYPE,
  RENDER_DRIVER_TYPE,
  TYPE_LEVEL_TARGET_ID,
  findExistingPairing,
  pairingDisplayName,
  usedDriverIdsForTarget,
  type ListedRecord,
} from "@/lib/public/driver-pairings";
import {
  defaultOutputId,
  driverEntry,
  isKnownOutput,
  pairableDriversForType,
  type DriverBindShape,
  type DriverCatalogEntry,
} from "@/lib/public/render-drivers";
import type { PageBuilderCell } from "@/lib/public/page-builder";

export type BindWizardRequest = {
  recordType: ElementTypeId;
  rowId: string;
  cellIndex: number;
  canvas: "primary" | "custom";
  preferredDriver?: string;
  preferredOutput?: string;
};

type Scope = "header" | "lines" | "type";

function listUrl(type: string, parentKind: string, parent: string) {
  return `/api/records?type=${encodeURIComponent(type)}&parent_kind=${encodeURIComponent(parentKind)}&parent=${encodeURIComponent(parent)}`;
}

function shapeForScope(scope: Scope): DriverBindShape | undefined {
  if (scope === "lines") return undefined;
  if (scope === "type") return "lines_only";
  return "header";
}

function scopeFromDriver(driverId: string | undefined, spec: { hasLines: boolean; allowsTypeLevel: boolean }): Scope {
  const shape = driverEntry(driverId)?.bindShape;
  if (shape === "lines_only" && spec.allowsTypeLevel) return "type";
  if ((shape === "lines_list" || shape === "line_single") && spec.hasLines) return "lines";
  return "header";
}

export function ElementBindWizard({
  request,
  onCancel,
  onBind,
}: {
  request: BindWizardRequest;
  onCancel: () => void;
  onBind: (patch: Partial<PageBuilderCell>) => void;
}) {
  const spec = elementTypeById(request.recordType) ?? ELEMENT_TYPE_PALETTE[0];
  const outputs = RECORD_OUTPUTS_BY_TYPE[spec.id];
  const [records, setRecords] = useState<ListedRecord[]>([]);
  const [pairings, setPairings] = useState<ListedRecord[]>([]);
  const [drivers, setDrivers] = useState<ListedRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<Scope>(scopeFromDriver(request.preferredDriver, spec));
  const [recordId, setRecordId] = useState("");
  const [driverKey, setDriverKey] = useState(request.preferredDriver ?? "");
  const [reuseId, setReuseId] = useState("");
  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState("12");
  const [outputId, setOutputId] = useState(
    request.preferredOutput && isKnownOutput(request.preferredDriver, request.preferredOutput)
      ? request.preferredOutput
      : defaultOutputId(request.preferredDriver),
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [recRes, pairRes, drvRes] = await Promise.all([
          fetch(listUrl(spec.recordType, spec.parentKind, spec.parentApiName), { credentials: "include" }),
          fetch(listUrl(DRIVER_PAIRING_TYPE, "environment", "custom"), { credentials: "include" }),
          fetch(listUrl(RENDER_DRIVER_TYPE, "environment", "custom"), { credentials: "include" }),
        ]);
        const recJson = recRes.ok ? await recRes.json() : { data: [] };
        const pairJson = pairRes.ok ? await pairRes.json() : { data: [] };
        const drvJson = drvRes.ok ? await drvRes.json() : { data: [] };
        if (cancelled) return;
        const recs = ((recJson.data ?? []) as ListedRecord[]).filter((r) => r.status !== "archived");
        setRecords(recs);
        setPairings((pairJson.data ?? []) as ListedRecord[]);
        setDrivers((drvJson.data ?? []) as ListedRecord[]);
        if (recs[0] && !spec.allowsTypeLevel) setRecordId(recs[0].id);
      } catch {
        if (!cancelled) setError("Could not load records for this Element type.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [spec.allowsTypeLevel, spec.parentApiName, spec.parentKind, spec.recordType]);

  const targetId = scope === "type" ? TYPE_LEVEL_TARGET_ID : recordId;
  const used = usedDriverIdsForTarget(pairings, spec.recordType, targetId || "__none__");
  const compatible = pairableDriversForType(spec.recordType, shapeForScope(scope)).filter((row) => {
    if (scope === "lines") return row.bindShape === "lines_list" || row.bindShape === "line_single";
    return true;
  });
  const unused = compatible.filter((row) => {
    const rec = drivers.find((d) => String(d.data?.code_key ?? "") === row.id);
    const driverRecordId = rec?.id ?? `rd-${row.id}`;
    return !used.has(driverRecordId) && !used.has(row.id);
  });
  const reuseRows = pairings.filter((row) => {
    const t = String(row.data?.target_record_type ?? "");
    const id = String(row.data?.target_record_id ?? "");
    return t === spec.recordType && id === (targetId || "__none__");
  });
  const selectedKey = driverKey || unused[0]?.id || "";
  const chosen: DriverCatalogEntry | undefined = compatible.find((row) => row.id === selectedKey);

  function mappedInput(name: string): string {
    if (inputMap[name] !== undefined) return inputMap[name];
    const guess = outputs.find(
      (o) => o.id === name || (name === "body" && o.id === "body_html") || (name === "title" && o.id === "name"),
    );
    return guess?.id ?? "";
  }

  const driverRecordId = (key: string) =>
    drivers.find((d) => String(d.data?.code_key ?? "") === key)?.id ?? `rd-${key}`;

  const finishWithPairing = (pairingId: string, key: string, recId: string) => {
    onBind({
      kind: "record",
      featureId: undefined,
      recordType: spec.recordType,
      recordId: recId === TYPE_LEVEL_TARGET_ID ? undefined : recId,
      recordMode: recId === TYPE_LEVEL_TARGET_ID ? "all" : "single",
      driver: key,
      pairingId,
      enabled: true,
      renderOutput: isKnownOutput(key, outputId) ? outputId : defaultOutputId(key),
    });
  };

  const submit = async () => {
    if (reuseId) {
      const row = pairings.find((p) => p.id === reuseId);
      const key = String(row?.data?.code_key ?? drivers.find((d) => d.id === row?.data?.driver_id)?.data?.code_key ?? selectedKey);
      finishWithPairing(reuseId, key || selectedKey, targetId);
      return;
    }
    if (!targetId) {
      setError("Pick a record, or create one on the Elements tab first.");
      return;
    }
    if (!chosen) {
      setError("Pick a Rendering Driver that is not already paired to this record.");
      return;
    }
    const existing = findExistingPairing(pairings, spec.recordType, targetId, driverRecordId(chosen.id));
    if (existing) {
      finishWithPairing(existing.id, chosen.id, targetId);
      return;
    }
    setBusy(true);
    setError(null);
    const recordName =
      targetId === TYPE_LEVEL_TARGET_ID
        ? `all ${spec.label}`
        : records.find((r) => r.id === targetId)?.name ?? targetId;
    const body = {
      type_api_name: DRIVER_PAIRING_TYPE,
      parent_kind: "environment",
      parent_api_name: "custom",
      name: pairingDisplayName(chosen.label, recordName),
      status: "active",
      data: {
        driver_id: driverRecordId(chosen.id),
        target_record_type: spec.recordType,
        target_record_id: targetId,
        target_kind: scope === "lines" ? "lines" : "header",
        input_map_json: JSON.stringify(
          Object.fromEntries((chosen?.inputs ?? []).map((input) => [input.name, mappedInput(input.name)])),
        ),
        record_mode: scope === "type" || chosen.bindShape === "lines_list" ? "list" : chosen.id === "header-line-stats" ? "rollup" : "single",
        filter_json: "[]",
        page_size: chosen.supportsPagination ? pageSize : "",
        page: chosen.supportsPagination ? "1" : "",
      },
    };
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "Could not save the pairing.");
        setBusy(false);
        return;
      }
      const id = String(json?.data?.id ?? json?.id ?? "");
      if (!id) {
        setError("Pairing saved but no id returned.");
        setBusy(false);
        return;
      }
      finishWithPairing(id, chosen.id, targetId);
    } catch {
      setError("Could not save the pairing.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="bind-wizard-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background p-5 shadow-lg"
      >
        <h2 id="bind-wizard-title" className="text-base font-semibold">
          Configure {spec.label}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{spec.description}</p>

        {records.length === 0 && !spec.allowsTypeLevel ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Create a {spec.label} record on Elements → {spec.label} first. This Cell stays empty.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {(spec.hasLines || spec.allowsTypeLevel) && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Scope</span>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value as Scope);
                    setDriverKey("");
                    setReuseId("");
                  }}
                >
                  {spec.allowsTypeLevel ? <option value="type">All records (type-level)</option> : null}
                  <option value="header">One header / record</option>
                  {spec.hasLines ? <option value="lines">Lines of a header</option> : null}
                </select>
              </label>
            )}

            {scope !== "type" && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Record</span>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={recordId}
                  onChange={(e) => {
                    setRecordId(e.target.value);
                    setDriverKey("");
                    setReuseId("");
                  }}
                >
                  {records.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name || row.id}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reuseRows.length > 0 && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Reuse an existing pairing</span>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={reuseId}
                  onChange={(e) => setReuseId(e.target.value)}
                >
                  <option value="">Create a new pairing</option>
                  {reuseRows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name || row.id}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {!reuseId && (
              <>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-muted-foreground">Rendering Driver (unused on this record)</span>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={selectedKey}
                    onChange={(e) => {
                      const next = e.target.value;
                      setDriverKey(next);
                      setOutputId(defaultOutputId(next));
                    }}
                  >
                    {unused.length === 0 ? (
                      <option value="">All compatible drivers are already paired</option>
                    ) : (
                      unused.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.label}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                {chosen && chosen.outputs.length > 1 ? (
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-muted-foreground">Recipe</span>
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={isKnownOutput(chosen.id, outputId) ? outputId : defaultOutputId(chosen.id)}
                      onChange={(e) => setOutputId(e.target.value)}
                    >
                      {chosen.outputs.map((out) => (
                        <option key={out.id} value={out.id}>
                          {out.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {chosen
                  ? chosen.inputs.map((input) => (
                      <label key={input.name} className="block text-sm">
                        <span className="mb-1 block text-xs text-muted-foreground">
                          {input.name} ← record output
                        </span>
                        <select
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          value={mappedInput(input.name)}
                          onChange={(e) =>
                            setInputMap((cur) => ({ ...cur, [input.name]: e.target.value }))
                          }
                        >
                          <option value="">(none)</option>
                          {outputs.map((out) => (
                            <option key={out.id} value={out.id}>
                              {out.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))
                  : null}

                {chosen?.supportsPagination ? (
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-muted-foreground">Page size</span>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value)}
                    />
                  </label>
                ) : null}
              </>
            )}
          </div>
        )}

        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={busy || (records.length === 0 && !spec.allowsTypeLevel && !reuseId)}
          >
            {busy ? "Saving…" : "Bind Cell"}
          </Button>
        </div>
      </div>
    </div>
  );
}
