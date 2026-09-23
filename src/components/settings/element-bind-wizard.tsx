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
  pairingAllowsTypeLevel,
  pairingDisplayName,
  pairingFromRecord,
  pairingPayload,
  type ListedRecord,
} from "@/lib/public/driver-pairings";
import {
  defaultOutputId,
  driverEntry,
  isKnownOutput,
  pairableDriversForType,
  type DriverCatalogEntry,
  type ElementSelectionMode,
} from "@/lib/public/render-drivers";
import type { PageBuilderCell } from "@/lib/public/page-builder";
import { recordTypeLabel } from "@/lib/public/element-types";
import { iconForBinding } from "@/components/settings/page-builder-controls";

export type BindWizardRequest = {
  recordType: ElementTypeId;
  rowId: string;
  cellIndex: number;
  canvas: "primary" | "custom";
  preferredDriver?: string;
  preferredOutput?: string;
};

function elementCardCopy(row: ListedRecord): { type: string; name: string } {
  const fields = pairingFromRecord(row);
  return {
    type: recordTypeLabel(fields?.target_record_type),
    name: row.name?.trim() || "Element",
  };
}

function listUrl(type: string, parentKind: string, parent: string) {
  return `/api/records?type=${encodeURIComponent(type)}&parent_kind=${encodeURIComponent(parentKind)}&parent=${encodeURIComponent(parent)}`;
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
  const [recordId, setRecordId] = useState("");
  const [driverKey, setDriverKey] = useState(request.preferredDriver ?? "");
  const [selectionMode, setSelectionMode] = useState<ElementSelectionMode>(
    driverEntry(request.preferredDriver)?.elementModes[0] ?? "one",
  );
  const [inputMap, setInputMap] = useState<Record<string, string>>({});
  const [filterJson, setFilterJson] = useState("[]");
  const [pageSize, setPageSize] = useState("12");
  const [outputId, setOutputId] = useState(
    request.preferredOutput && isKnownOutput(request.preferredDriver, request.preferredOutput)
      ? request.preferredOutput
      : defaultOutputId(request.preferredDriver),
  );
  /** Existing Element for this driver, or "new" to configure a selection that does not exist yet. */
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const skipRecords = spec.allowsTypeLevel && !spec.hasLines;
        const [recRes, pairRes, drvRes] = await Promise.all([
          skipRecords
            ? Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }))
            : fetch(listUrl(spec.recordType, spec.parentKind, spec.parentApiName), { credentials: "include" }),
          fetch(listUrl(DRIVER_PAIRING_TYPE, "environment", "custom"), { credentials: "include" }),
          fetch(listUrl(RENDER_DRIVER_TYPE, "environment", "custom"), { credentials: "include" }),
        ]);
        const recJson = recRes.ok ? await recRes.json() : { data: [] };
        const pairJson = pairRes.ok ? await pairRes.json() : { data: [] };
        const drvJson = drvRes.ok ? await drvRes.json() : { data: [] };
        if (cancelled) return;
        const recs = ((recJson.data ?? []) as ListedRecord[]).filter((r) => r.status !== "archived");
        setRecords(recs);
        const loadedPairings = (pairJson.data ?? []) as ListedRecord[];
        const loadedDrivers = (drvJson.data ?? []) as ListedRecord[];
        setPairings(loadedPairings);
        setDrivers(loadedDrivers);
        const driverRowId =
          loadedDrivers.find((d) => String(d.data?.code_key ?? "") === (request.preferredDriver ?? ""))?.id ??
          (request.preferredDriver ? `rd-${request.preferredDriver}` : "");
        const already = driverRowId
          ? loadedPairings.filter((row) => pairingFromRecord(row)?.driver_id === driverRowId)
          : [];
        if (already[0]) setPickedId(already[0].id);
        else if (recs[0] && !pairingAllowsTypeLevel(request.preferredDriver ?? "") && !spec.allowsTypeLevel) {
          setRecordId(recs[0].id);
        } else if (pairingAllowsTypeLevel(request.preferredDriver ?? "") || spec.allowsTypeLevel) {
          setRecordId(TYPE_LEVEL_TARGET_ID);
        }
      } catch {
        if (!cancelled) setError("Could not load records for this Element type.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [spec.allowsTypeLevel, spec.parentApiName, spec.parentKind, spec.recordType]);

  const typeLevelOnly =
    selectionMode !== "one" || pairingAllowsTypeLevel(driverKey || request.preferredDriver || "");
  const targetId = typeLevelOnly && (!recordId || recordId === TYPE_LEVEL_TARGET_ID)
    ? TYPE_LEVEL_TARGET_ID
    : recordId;
  const compatible = pairableDriversForType(spec.recordType);
  const selectedKey = request.preferredDriver || driverKey || compatible[0]?.id || "";
  const chosen: DriverCatalogEntry | undefined =
    compatible.find((row) => row.id === selectedKey) ?? driverEntry(selectedKey);

  function mappedInput(name: string): string {
    if (inputMap[name] !== undefined) return inputMap[name];
    const guess = outputs.find(
      (o) => o.id === name || (name === "body" && o.id === "body_html") || (name === "title" && o.id === "name"),
    );
    return guess?.id ?? "";
  }

  const driverRecordId = (key: string) =>
    drivers.find((d) => String(d.data?.code_key ?? "") === key)?.id ?? `rd-${key}`;
  const driverPairings = chosen
    ? pairings.filter((row) => pairingFromRecord(row)?.driver_id === driverRecordId(chosen.id))
    : [];
  const usingExisting = Boolean(pickedId && pickedId !== "new" && driverPairings.some((row) => row.id === pickedId));
  const existing = !usingExisting && chosen && (targetId || selectionMode !== "one")
    ? findExistingPairing(
        pairings,
        spec.recordType,
        targetId || TYPE_LEVEL_TARGET_ID,
        driverRecordId(chosen.id),
        selectionMode,
        selectionMode === "filter" ? filterJson : "[]",
      )
    : undefined;

  const finishWithPairing = (pairingId: string, key: string, recId: string, recordType?: string) => {
    onBind({
      kind: "record",
      featureId: undefined,
      recordType: recordType || spec.recordType,
      recordId: recId === TYPE_LEVEL_TARGET_ID ? undefined : recId,
      recordMode: recId === TYPE_LEVEL_TARGET_ID ? "all" : "single",
      driver: key,
      pairingId,
      enabled: true,
      renderOutput: isKnownOutput(key, outputId) ? outputId : defaultOutputId(key),
    });
  };

  const submit = async () => {
    if (!chosen) {
      setError("Pick a Rendering Driver.");
      return;
    }
    if (usingExisting && pickedId) {
      const row = driverPairings.find((item) => item.id === pickedId);
      const fields = row ? pairingFromRecord(row) : null;
      finishWithPairing(
        pickedId,
        chosen.id,
        fields?.target_record_id || TYPE_LEVEL_TARGET_ID,
        fields?.target_record_type,
      );
      return;
    }
    if (!targetId) {
      setError("Pick a record, or create one on the Elements tab first.");
      return;
    }
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
      data: pairingPayload({
        driverRecordId: driverRecordId(chosen.id),
        codeKey: chosen.id,
        targetType: spec.recordType,
        targetId,
        selectionMode,
        inputMap: Object.fromEntries((chosen.inputs ?? []).map((input) => [input.name, mappedInput(input.name)])),
        filterJson: selectionMode === "filter" ? filterJson : "[]",
        pageSize: chosen.supportsPagination ? pageSize : "",
        page: chosen.supportsPagination ? "1" : "",
      }),
    };
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        const pairRes = await fetch(listUrl(DRIVER_PAIRING_TYPE, "environment", "custom"), {
          credentials: "include",
        });
        const pairJson = pairRes.ok ? await pairRes.json() : { data: [] };
        const next = (pairJson.data ?? []) as ListedRecord[];
        const hit = findExistingPairing(
          next,
          spec.recordType,
          targetId,
          driverRecordId(chosen.id),
          selectionMode,
          selectionMode === "filter" ? filterJson : "[]",
        );
        if (hit) {
          finishWithPairing(hit.id, chosen.id, targetId);
          return;
        }
        setError(json?.error?.message || "That Element already exists.");
        setBusy(false);
        return;
      }
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
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border bg-background p-5 shadow-lg"
      >
        <h2 id="bind-wizard-title" className="text-base font-semibold">
          {chosen?.label ?? spec.label}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Record type stays on the Driver. This Cell uses an Element as it is already configured.
        </p>

        {records.length === 0 && !spec.allowsTypeLevel && driverPairings.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Create a {spec.label} record in its zone listing first. This Cell stays empty.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {driverPairings.length > 0 ? (
              <div className="space-y-2">
                <span className="block text-xs text-muted-foreground">Element</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {driverPairings.map((row) => {
                    const card = elementCardCopy(row);
                    const Icon = iconForBinding({ driver: chosen?.id, recordType: card.type });
                    const selected = usingExisting && pickedId === row.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setPickedId(row.id)}
                        className={
                          "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left " +
                          (selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/30 hover:border-primary/50")
                        }
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-xs text-muted-foreground">{card.type}</span>
                        <span className="text-sm font-medium leading-tight">{card.name}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPickedId("new")}
                    className={
                      "flex min-h-[6.5rem] flex-col items-start justify-center rounded-lg border border-dashed p-3 text-left text-sm " +
                      (!usingExisting ? "border-primary bg-primary/5" : "border-border text-muted-foreground")
                    }
                  >
                    New selection
                  </button>
                </div>
              </div>
            ) : null}

            {usingExisting ? (
              <p className="text-xs text-muted-foreground">
                Add uses this Element as saved. Change one record, a filter, or all records on Canvas → Elements.
              </p>
            ) : null}

            {!usingExisting && !typeLevelOnly && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Record</span>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={recordId}
                  onChange={(e) => {
                    setRecordId(e.target.value);
                    setDriverKey("");
                  }}
                >
                  {spec.allowsTypeLevel ? (
                    <option value={TYPE_LEVEL_TARGET_ID}>All records (type-level)</option>
                  ) : null}
                  {records.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name || row.id}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {request.preferredDriver ? (
              <p className="text-xs text-muted-foreground">
                Driver {chosen?.label ?? request.preferredDriver}. Shape and record type live on the driver.
              </p>
            ) : (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Rendering Driver</span>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={selectedKey}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDriverKey(next);
                    setOutputId(defaultOutputId(next));
                    setSelectionMode(driverEntry(next)?.elementModes[0] ?? "one");
                  }}
                >
                  {compatible.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {!usingExisting && chosen && chosen.elementModes.length > 1 ? (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Records</span>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={selectionMode}
                  onChange={(e) => setSelectionMode(e.target.value as ElementSelectionMode)}
                >
                  {chosen.elementModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode === "one" ? "One record" : mode === "filter" ? "Filter" : "All records"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {existing ? (
              <p className="text-xs text-muted-foreground">
                This Element already exists. Add attaches it to this Cell.
              </p>
            ) : null}

            {chosen && chosen.outputs.length > 1 ? (
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Render output</span>
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

            {!usingExisting && !existing && (
              <>
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

                {selectionMode === "filter" ? (
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-muted-foreground">Filter (JSON)</span>
                    <textarea
                      className="min-h-[64px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={filterJson}
                      onChange={(e) => setFilterJson(e.target.value)}
                    />
                  </label>
                ) : null}

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
            disabled={busy || (records.length === 0 && !spec.allowsTypeLevel && !existing && !usingExisting)}
          >
            {busy ? "Saving…" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
