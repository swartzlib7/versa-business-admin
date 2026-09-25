"use client";

import { useEffect, useState } from "react";
import { FileText, Home, LayoutGrid } from "lucide-react";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { MENU_ORDER_EVENT } from "@/lib/nav";
import { cn } from "@/lib/utils";
import {
  isRowOn,
  normalizePageBuilder,
  primaryCanvasLabel,
  type PageBuilderSection,
  type PageBuilderState,
} from "@/lib/public/page-builder";

function MenuRow({
  label,
  on,
  onChange,
  depth = 0,
  icon: Icon,
  muted,
}: {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
  depth?: number;
  icon: typeof Home;
  muted?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2" style={{ paddingLeft: `${0.75 + depth * 1.5}rem` }}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className={cn("flex-1 text-sm font-medium", (!on || muted) && "text-muted-foreground")}>{label}</span>
      <BooleanSwitch checked={on} onChange={onChange} label={on ? "On" : "Off"} labelSide="start" />
    </li>
  );
}

/** Public menu entries that come from canvases and their rows. */
export function CanvasMenuTree() {
  const [builder, setBuilder] = useState<PageBuilderState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("menu"))))
      .then((json: { data?: { page_builder?: unknown } }) => {
        setBuilder(normalizePageBuilder(json.data?.page_builder));
      })
      .catch(() => setError("Could not load canvases."));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (next: PageBuilderState) => {
    setBuilder(next);
    setError(null);
    const res = await fetch("/api/settings/system", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_builder: next }),
    });
    if (!res.ok) {
      setError("Could not save the menu.");
      load();
      return;
    }
    window.dispatchEvent(new CustomEvent(MENU_ORDER_EVENT));
  };

  if (!builder) return error ? <p className="text-sm text-destructive">{error}</p> : null;

  const visibleRows = (rows: PageBuilderSection[]) => rows.filter((row) => isRowOn(row));
  const home = builder.home_sections ?? [];

  return (
    <div className="space-y-2">
      <ol className="divide-y divide-border rounded-lg border border-border">
        <li className="flex items-center gap-3 px-3 py-2">
          <Home className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1 text-sm font-medium">{primaryCanvasLabel(builder)}</span>
        </li>
        {visibleRows(home).map((row) => (
          <MenuRow
            key={`home-${row.id}`}
            depth={1}
            icon={LayoutGrid}
            label={row.label}
            on={row.in_menu !== false}
            onChange={(on) =>
              void save({
                ...builder,
                home_sections: home.map((item) => (item.id === row.id ? { ...item, in_menu: on } : item)),
              })
            }
          />
        ))}
        {builder.canvases.map((canvas, index) => {
          const setCanvas = (patch: Partial<typeof canvas>) => {
            const canvases = builder.canvases.map((item, i) => (i === index ? { ...item, ...patch } : item));
            void save({ ...builder, custom: canvases[0], canvases });
          };
          const rows = canvas.content_mode === "html" ? [] : visibleRows(canvas.sections);
          return [
            <MenuRow
              key={`canvas-${canvas.slug}`}
              depth={1}
              icon={FileText}
              label={canvas.label}
              on={canvas.menu_enabled !== false}
              onChange={(on) => setCanvas({ menu_enabled: on })}
            />,
            ...rows.map((row) => (
              <MenuRow
                key={`${canvas.slug}-${row.id}`}
                depth={2}
                icon={LayoutGrid}
                label={row.label}
                on={row.in_menu !== false}
                muted={canvas.menu_enabled === false}
                onChange={(on) =>
                  setCanvas({
                    sections: canvas.sections.map((section) =>
                      section.id === row.id ? { ...section, in_menu: on } : section,
                    ),
                  })
                }
              />
            )),
          ];
        })}
      </ol>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
