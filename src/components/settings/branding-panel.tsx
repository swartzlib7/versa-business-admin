"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { FileField } from "@/components/ui/file-field";
import { VersaConstellation } from "@/components/public/versa-constellation";
import { useBrand } from "@/components/shell/brand-provider";
import { cn } from "@/lib/utils";
import {
  DEFAULT_GLOW_COLOR,
  DEFAULT_GLOW_SPREAD,
  LOGO_BASE_PX,
  LOGO_SCALE_MAX,
  LOGO_SCALE_MIN,
  clampLogoScale,
  logoGlowFilter,
  logoPx,
} from "@/lib/brand-display";

export type BrandingSubTab = "brand" | "logo" | "sky";

type BrandDraft = {
  name: string;
  color: string;
  logo: string;
  logoName: string;
  opacity: number;
  glow: number;
  glowColor: string;
  glowSpread: number;
  scaleMenu: number;
  scaleHome: number;
  scaleFooter: number;
  variant: "classic" | "realistic";
  density: number;
  headline: string;
  subhead: string;
};

const emptyDraft = (brand: ReturnType<typeof useBrand>): BrandDraft => ({
  name: brand.brand_name,
  color: brand.brand_color,
  logo: brand.brand_logo_url ?? "",
  logoName: brand.brand_logo_url ? "Current logo" : "",
  opacity: brand.brand_logo_opacity ?? 1,
  glow: brand.brand_logo_glow ?? 0,
  glowColor: brand.brand_logo_glow_color ?? DEFAULT_GLOW_COLOR,
  glowSpread: brand.brand_logo_glow_spread ?? DEFAULT_GLOW_SPREAD,
  scaleMenu: clampLogoScale(brand.brand_logo_scale_menu),
  scaleHome: clampLogoScale(brand.brand_logo_scale_home),
  scaleFooter: clampLogoScale(brand.brand_logo_scale_footer),
  variant: brand.constellation_variant === "realistic" ? "realistic" : "classic",
  density: brand.constellation_density ?? 0,
  headline: "",
  subhead: "",
});

function fieldClass() {
  return "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
}

function ScaleSlider({
  label,
  value,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  accent: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} ({Math.round(value * 100)}%)
      </label>
      <input
        type="range"
        min={LOGO_SCALE_MIN}
        max={LOGO_SCALE_MAX}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

function LogoPreviewSlot({
  label,
  width,
  height,
  draft,
}: {
  label: string;
  width: number;
  height?: number;
  draft: BrandDraft;
}) {
  const filter = logoGlowFilter(draft.glow, draft.glowColor, draft.glowSpread);
  const boxH = height ?? width;
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        {label} · {width}px
      </div>
      <div className="flex min-h-[4.5rem] items-center justify-center overflow-auto rounded-md border border-border/70 bg-muted/20 p-3">
        {draft.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- live preview of uploaded logo
          <img
            src={draft.logo}
            alt={draft.name || "Logo"}
            className="object-contain"
            style={{
              width,
              height: height ?? "auto",
              maxHeight: boxH,
              opacity: draft.opacity,
              filter,
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-md text-sm font-bold text-white"
            style={{
              width,
              height: boxH,
              backgroundColor: draft.color,
              opacity: draft.opacity,
              filter,
            }}
          >
            {draft.name.slice(0, 2).toUpperCase() || "VA"}
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandingPanel({ subTab }: { subTab: BrandingSubTab }) {
  const brand = useBrand();
  const [draft, setDraft] = useState<BrandDraft>(() => emptyDraft(brand));
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/settings/branding").then((r) => r.json()),
      fetch("/api/settings/public-content").then((r) => r.json()),
    ])
      .then(([branding, publicContent]) => {
        if (cancelled) return;
        const b = branding?.data ?? {};
        const p = publicContent?.data ?? {};
        setDraft({
          name: typeof b.brand_name === "string" ? b.brand_name : brand.brand_name,
          color: typeof b.brand_color === "string" ? b.brand_color : brand.brand_color,
          logo: typeof b.brand_logo_url === "string" && b.brand_logo_url ? b.brand_logo_url : "",
          logoName:
            typeof b.brand_logo_url === "string" && b.brand_logo_url ? "Current logo" : "",
          opacity: typeof b.brand_logo_opacity === "number" ? b.brand_logo_opacity : 1,
          glow: typeof b.brand_logo_glow === "number" ? b.brand_logo_glow : 0,
          glowColor:
            typeof b.brand_logo_glow_color === "string" && b.brand_logo_glow_color
              ? b.brand_logo_glow_color
              : DEFAULT_GLOW_COLOR,
          glowSpread:
            typeof b.brand_logo_glow_spread === "number"
              ? b.brand_logo_glow_spread
              : DEFAULT_GLOW_SPREAD,
          scaleMenu: clampLogoScale(b.brand_logo_scale_menu),
          scaleHome: clampLogoScale(b.brand_logo_scale_home),
          scaleFooter: clampLogoScale(b.brand_logo_scale_footer),
          variant: b.constellation_variant === "realistic" ? "realistic" : "classic",
          density: typeof b.constellation_density === "number" ? b.constellation_density : 0,
          headline: typeof p.hero_headline === "string" ? p.hero_headline : "",
          subhead: typeof p.hero_subhead === "string" ? p.hero_subhead : "",
        });
      })
      .catch(() => {
        if (!cancelled) setSaveError("Could not load branding settings.");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [brand.brand_name, brand.brand_color]);

  const patch = (partial: Partial<BrandDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: draft.name.trim(),
          brand_color: draft.color,
          brand_logo_url: draft.logo || null,
          brand_logo_opacity: draft.opacity,
          brand_logo_glow: draft.glow,
          brand_logo_glow_color: draft.glowColor,
          brand_logo_glow_spread: draft.glowSpread,
          brand_logo_scale_menu: draft.scaleMenu,
          brand_logo_scale_home: draft.scaleHome,
          brand_logo_scale_footer: draft.scaleFooter,
          constellation_variant: draft.variant,
          constellation_density: draft.density,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setSaveError(payload?.error?.message ?? "Save failed. Please try again.");
        return;
      }
      const pub = await fetch("/api/settings/public-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero_headline: draft.headline,
          hero_subhead: draft.subhead,
        }),
      });
      if (!pub.ok) {
        const payload = await pub.json().catch(() => null);
        setSaveError(payload?.error?.message ?? "Brand saved; hero copy failed.");
        return;
      }
      setSaved(true);
      window.location.reload();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(emptyDraft(brand));
    setSaveError(null);
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      {subTab === "brand" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Your brand name"
                className={fieldClass()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => patch({ color: e.target.value })}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <input
                  value={draft.color}
                  onChange={(e) => patch({ color: e.target.value })}
                  placeholder="#6366f1"
                  className={fieldClass()}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Hero copy</p>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Headline</span>
              <input
                value={draft.headline}
                onChange={(e) => patch({ headline: e.target.value })}
                className={fieldClass()}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Subhead</span>
              <textarea
                value={draft.subhead}
                onChange={(e) => patch({ subhead: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
          </div>
        </div>
      ) : null}

      {subTab === "logo" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Logo</label>
            <FileField
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              filename={draft.logoName || (draft.logo ? "Current logo" : null)}
              chooseLabel="Choose file"
              emptyLabel="No file chosen"
              removeLabel="Remove logo"
              hint="Optional. PNG, JPG, SVG, or WebP. Initials are used when empty."
              onFile={(file) => {
                if (file.size > 500 * 1024) {
                  setSaveError("Logo must be 500 KB or smaller.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  patch({
                    logo: typeof reader.result === "string" ? reader.result : "",
                    logoName: file.name,
                  });
                  setSaveError(null);
                };
                reader.readAsDataURL(file);
              }}
              onRemove={() => patch({ logo: "", logoName: "" })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Translucency ({Math.round(draft.opacity * 100)}%)
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={draft.opacity}
                onChange={(e) => patch({ opacity: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: draft.color }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Glow ({Math.round(draft.glow * 100)}%)
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={draft.glow}
                onChange={(e) => patch({ glow: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: draft.color }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={draft.glowColor}
                  onChange={(e) => patch({ glowColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <input
                  value={draft.glowColor}
                  onChange={(e) => patch({ glowColor: e.target.value })}
                  className={fieldClass()}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Spread ({Math.round(draft.glowSpread * 100)}%)
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={draft.glowSpread}
                onChange={(e) => patch({ glowSpread: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: draft.color }}
              />
            </div>
          </div>
          <div className="space-y-3 rounded-lg border p-4" style={{ borderColor: draft.color }}>
            <div className="text-xs text-muted-foreground">Preview</div>
            <div className="grid gap-4 lg:grid-cols-3">
              <LogoPreviewSlot
                label="Menu"
                width={logoPx(LOGO_BASE_PX.menu, draft.scaleMenu)}
                draft={draft}
              />
              <LogoPreviewSlot
                label="Home page"
                width={logoPx(LOGO_BASE_PX.homeDesktop, draft.scaleHome)}
                draft={draft}
              />
              <LogoPreviewSlot
                label="Footer"
                width={logoPx(LOGO_BASE_PX.footer, draft.scaleFooter)}
                draft={draft}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <ScaleSlider
                label="Menu"
                value={draft.scaleMenu}
                accent={draft.color}
                onChange={(scaleMenu) => patch({ scaleMenu })}
              />
              <ScaleSlider
                label="Home page"
                value={draft.scaleHome}
                accent={draft.color}
                onChange={(scaleHome) => patch({ scaleHome })}
              />
              <ScaleSlider
                label="Footer"
                value={draft.scaleFooter}
                accent={draft.color}
                onChange={(scaleFooter) => patch({ scaleFooter })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sliders are centered on the current sizes. Range is 75% to 125%.
            </p>
          </div>
        </div>
      ) : null}

      {subTab === "sky" ? (
        <div className="space-y-4">
          <div
            role="radiogroup"
            aria-label="Sky animation"
            className="flex flex-wrap gap-1 rounded-lg border p-1"
            style={{ borderColor: draft.color + "33", backgroundColor: draft.color + "0d" }}
          >
            {([
              { id: "classic", label: "Classic" },
              { id: "realistic", label: "Realistic" },
            ] as const).map((opt) => {
              const on = draft.variant === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => patch({ variant: opt.id })}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    on
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                  )}
                  style={on ? { boxShadow: `inset 0 -2px 0 ${draft.color}` } : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="relative h-56 overflow-hidden rounded-lg border border-border bg-black">
            <VersaConstellation
              variant={draft.variant}
              density={draft.density}
              preview
            />
          </div>
          {draft.variant === "realistic" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Density ({Math.round(1 + draft.density * 9)}×)
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={draft.density}
                onChange={(e) => patch({ density: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: draft.color }}
              />
              <p className="text-xs text-muted-foreground">
                1× is the current field. At 10× the stars compact into the Classic
                milky-way band.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Classic is the original milky-way band. Switch to Realistic for
              natural tints, glints, density, and satellites.
            </p>
          )}
        </div>
      ) : null}

      {saveError ? (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}
      {!loaded ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : null}
      <Separator />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !loaded}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: brand.brand_color }}
        >
          {saved ? "Saved" : saving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
