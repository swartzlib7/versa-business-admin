"use client";

import { useEffect, useMemo, useState } from "react";
import {
  detailSectionsFromCatalog,
  editFieldsFromCatalog,
  placeIdLast,
} from "@/lib/catalog/layout-to-fields";
import {
  savedLayoutToRuntimeSections,
  type RuntimeFieldSource,
  type SavedLayoutConfig,
} from "@/lib/catalog/runtime-layout";
import type { LayoutSection } from "@/components/catalog/layout-driven-form";

/**
 * Loads session-saved Layout Editor configs for an object and merges them
 * over catalog defaults. Edit vs detail are distinct layoutType keys.
 *
 * For dynamic record objects, pass `fieldSource` (server-fetched catalog
 * fields) so saved layouts resolve visible fields against the real field set
 * instead of the (empty) client fixture list.
 */
export function useSavedRuntimeLayouts(
  objectApiName: string,
  fieldSource?: RuntimeFieldSource[],
): {
  detail: LayoutSection[];
  edit: LayoutSection[];
  loading: boolean;
} {
  const [savedLayouts, setSavedLayouts] = useState<
    Partial<Record<"detail" | "edit", SavedLayoutConfig>>
  >({});
  const [loading, setLoading] = useState(Boolean(objectApiName));

  const detail = useMemo(
    () =>
      objectApiName
        ? detailSectionsFromCatalog(objectApiName)
        : { sections: [] as LayoutSection[] },
    [objectApiName],
  );
  const edit = useMemo(
    () =>
      objectApiName
        ? editFieldsFromCatalog(objectApiName)
        : { sections: [] as LayoutSection[] },
    [objectApiName],
  );

  useEffect(() => {
    if (!objectApiName) {
      setSavedLayouts({});
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    Promise.all(
      (["detail", "edit"] as const).map((layoutType) =>
        fetch(
          `/api/catalog/layouts?objectApiName=${encodeURIComponent(objectApiName)}&layoutType=${layoutType}`,
          { signal: controller.signal, credentials: "include" },
        )
          .then((response) =>
            response.ok ? response.json() : { data: null },
          )
          .then((json) => [layoutType, json.data] as const),
      ),
    )
      .then((entries) => {
        if (!controller.signal.aborted) {
          setSavedLayouts(Object.fromEntries(entries));
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          console.warn(
            `Saved layouts unavailable for ${objectApiName}; using catalog defaults.`,
            error,
          );
          setSavedLayouts({});
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [objectApiName]);

  const runtime = useMemo(() => {
    const withIdLast = (sections: LayoutSection[]) => {
      const pulled: LayoutSection["fields"] = [];
      const next = sections.map((sec) => {
        const keep = sec.fields.filter((f) => {
          if (f.key === "id") {
            pulled.push(f);
            return false;
          }
          return true;
        });
        return { ...sec, fields: keep };
      });
      if (!pulled.length) return next;
      const last = next[next.length - 1];
      if (!last) return [{ id: "record", label: "Record", columns: 2 as const, fields: placeIdLast(pulled) }];
      return next.map((sec, i) =>
        i === next.length - 1 ? { ...sec, fields: placeIdLast([...sec.fields, ...pulled]) } : sec,
      );
    };
    return {
      detail: withIdLast(
        savedLayoutToRuntimeSections(
          savedLayouts.detail,
          objectApiName,
          "detail",
          fieldSource,
        ) ?? detail.sections,
      ),
      edit: withIdLast(
        savedLayoutToRuntimeSections(
          savedLayouts.edit,
          objectApiName,
          "edit",
          fieldSource,
        ) ?? edit.sections,
      ),
      loading,
    };
  },
    [detail.sections, edit.sections, objectApiName, savedLayouts, loading, fieldSource],
  );

  return runtime;
}
