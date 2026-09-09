"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { FileField } from "@/components/ui/file-field";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { VersaConstellation } from "@/components/public/versa-constellation";
import { useBrand } from "@/components/shell/brand-provider";
import { cn } from "@/lib/utils";
import {
  LOGO_BASE_PX,
  LOGO_MAX_BYTES,
  LOGO_PREVIEW_BOX_PX,
  LOGO_PX_MAX,
  LOGO_PX_MIN,
  LOGO_SCALE_MAX,
  LOGO_SCALE_MIN,
  LOGO_UPLOAD_HINT,
  SKY_DENSITY_DEFAULT,
  SKY_DENSITY_LEVEL_MAX,
  SKY_DENSITY_LEVEL_MIN,
  SKY_FREQ_STEPS,
  SKY_ZOOM_MAX,
  SKY_ZOOM_MIN,
  SKY_ZOOM_STEP,
  clampLogoScale,
  clampSkyFrequency,
  clampSkyZoom,
  formatSkyFrequency,
  skyFreqIndex,
  logoPx,
  logoSurfaceFilter,
  resolveLogoSurfaces,
  resolveSkyEffects,
  skyDensityFromLevel,
  skyDensityLevel,
  type LogoSurfaceId,
  type LogoSurfaceStyle,
  type LogoSurfaces,
  type SkyEffectId,
  type SkyEffectStyle,
  type SkyEffects,
} from "@/lib/brand-display";

export type BrandingSubTab = "brand" | "logo" | "sky";

type BrandDraft = {
  name: string;
  color: string;
  logo: string;
  logoName: string;
  surfaces: LogoSurfaces;
  variant: "classic" | "realistic";
  density: number;
  zoom: number;
  effects: SkyEffects;
  headline: string;
  subhead: string;
};

const emptyDraft = (brand: ReturnType<typeof useBrand>): BrandDraft => ({
  name: brand.brand_name,
  color: brand.brand_color,
  logo: brand.brand_logo_url ?? "",
  logoName: brand.brand_logo_url ? "Current logo" : "",
  surfaces: resolveLogoSurfaces(brand as unknown as Record<string, unknown>),
  variant: brand.constellation_variant === "realistic" ? "realistic" : "classic",
  density: brand.constellation_density ?? SKY_DENSITY_DEFAULT,
  zoom: clampSkyZoom(brand.constellation_zoom),
  effects: resolveSkyEffects(brand.constellation_effects),
  headline: "",
  subhead: "",
});

function fieldClass() {
  return "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the file."));
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function measureImage(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("That file is not a readable image."));
    img.src = src;
  });
}

function LogoSurfaceColumn({
  label,
  surfaceId,
  logoSize,
  draft,
  onChange,
}: {
  label: string;
  surfaceId: LogoSurfaceId;
  logoSize: number;
  draft: BrandDraft;
  onChange: (id: LogoSurfaceId, patch: Partial<LogoSurfaceStyle>) => void;
}) {
  const surface = draft.surfaces[surfaceId];
  const filter = logoSurfaceFilter(surface);
  const patch = (partial: Partial<LogoSurfaceStyle>) => onChange(surfaceId, partial);
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {label} · {logoSize}px
      </div>
      <div
        className="grid place-items-center overflow-hidden rounded-md border border-border/70 bg-muted/20"
        style={{ width: "100%", height: LOGO_PREVIEW_BOX_PX }}
      >
        {draft.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- live preview of uploaded logo
          <img
            src={draft.logo}
            alt={draft.name || "Logo"}
            className="object-contain"
            style={{
              width: logoSize,
              height: logoSize,
              opacity: surface.opacity,
              filter,
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-md text-sm font-bold text-white"
            style={{
              width: logoSize,
              height: logoSize,
              backgroundColor: draft.color,
              opacity: surface.opacity,
              filter,
            }}
          >
            {draft.name.slice(0, 2).toUpperCase() || "VA"}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Translucency ({Math.round(surface.opacity * 100)}%)
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={surface.opacity}
          onChange={(e) => patch({ opacity: Number(e.target.value) })}
          className="w-full"
          style={{ accentColor: draft.color }}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Glow ({Math.round(surface.glow * 100)}%)
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={surface.glow}
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
            value={surface.glowColor}
            onChange={(e) => patch({ glowColor: e.target.value })}
            className="h-10 w-14 cursor-pointer p-1"
          />
          <input
            value={surface.glowColor}
            onChange={(e) => patch({ glowColor: e.target.value })}
            className={fieldClass()}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Spread ({Math.round(surface.glowSpread * 100)}%)
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={surface.glowSpread}
          onChange={(e) => patch({ glowSpread: Number(e.target.value) })}
          className="w-full"
          style={{ accentColor: draft.color }}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Size ({Math.round(surface.scale * 100)}%)
        </label>
        <input
          type="range"
          min={LOGO_SCALE_MIN}
          max={LOGO_SCALE_MAX}
          step={0.01}
          value={surface.scale}
          onChange={(e) => patch({ scale: clampLogoScale(Number(e.target.value)) })}
          className="w-full"
          style={{ accentColor: draft.color }}
        />
      </div>
    </div>
  );
}

function SkyEffectRow({
  title,
  hint,
  style,
  color,
  onChange,
}: {
  title: string;
  hint: string;
  style: SkyEffectStyle;
  color: string;
  onChange: (partial: Partial<SkyEffectStyle>) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <BooleanSwitch
          checked={style.enabled}
          onChange={(enabled) => onChange({ enabled })}
          label={style.enabled ? "On" : "Off"}
          labelSide="start"
        />
      </div>
      {style.enabled ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Zoom ({Math.round(style.zoom * 100)}%)
            </label>
            <input
              type="range"
              min={SKY_ZOOM_MIN}
              max={SKY_ZOOM_MAX}
              step={SKY_ZOOM_STEP}
              value={style.zoom}
              onChange={(e) => onChange({ zoom: clampSkyZoom(Number(e.target.value)) })}
              className="w-full"
              style={{ accentColor: color }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Frequency ({formatSkyFrequency(style.frequency)})
            </label>
            <input
              type="range"
              min={0}
              max={SKY_FREQ_STEPS.length - 1}
              step={1}
              value={skyFreqIndex(style.frequency)}
              onChange={(e) =>
                onChange({
                  frequency: clampSkyFrequency(SKY_FREQ_STEPS[Number(e.target.value)] ?? 1),
                })
              }
              className="w-full"
              style={{ accentColor: color }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              {SKY_FREQ_STEPS.map((step, i) => (
                <span key={i}>{formatSkyFrequency(step)}</span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BrandingPanel({
  subTab,
  fill = false,
}: {
  subTab: BrandingSubTab;
  fill?: boolean;
}) {
  const brand = useBrand();
  const [draft, setDraft] = useState<BrandDraft>(() => emptyDraft(brand));
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [skyFullscreen, setSkyFullscreen] = useState(false);

  useEffect(() => {
    if (!skyFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSkyFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [skyFullscreen]);

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
          surfaces: resolveLogoSurfaces(b as Record<string, unknown>),
          variant: b.constellation_variant === "realistic" ? "realistic" : "classic",
          density: typeof b.constellation_density === "number" ? b.constellation_density : SKY_DENSITY_DEFAULT,
          zoom: clampSkyZoom(b.constellation_zoom),
          effects: resolveSkyEffects(b.constellation_effects),
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

  const patchSurface = (id: LogoSurfaceId, partial: Partial<LogoSurfaceStyle>) => {
    setDraft((prev) => ({
      ...prev,
      surfaces: {
        ...prev.surfaces,
        [id]: { ...prev.surfaces[id], ...partial },
      },
    }));
    setSaved(false);
  };

  const patchEffect = (id: SkyEffectId, partial: Partial<SkyEffectStyle>) => {
    setDraft((prev) => ({
      ...prev,
      effects: {
        ...prev.effects,
        [id]: { ...prev.effects[id], ...partial },
      },
    }));
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
          brand_logo_surfaces: draft.surfaces,
          brand_logo_opacity: draft.surfaces.home.opacity,
          brand_logo_glow: draft.surfaces.home.glow,
          brand_logo_glow_color: draft.surfaces.home.glowColor,
          brand_logo_glow_spread: draft.surfaces.home.glowSpread,
          brand_logo_scale_menu: draft.surfaces.menu.scale,
          brand_logo_scale_home: draft.surfaces.home.scale,
          brand_logo_scale_footer: draft.surfaces.footer.scale,
          constellation_variant: draft.variant,
          constellation_density: draft.density,
          constellation_zoom: draft.zoom,
          constellation_effects: draft.effects,
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
      const url = new URL(window.location.href);
      if (subTab === "sky") {
        url.searchParams.set("tab", "sky");
        url.searchParams.delete("sub");
      } else {
        url.searchParams.set("tab", "branding");
        if (subTab === "brand") url.searchParams.delete("sub");
        else url.searchParams.set("sub", subTab);
      }
      window.location.assign(`${url.pathname}${url.search}`);
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

  const handleLogoFile = async (file: File) => {
    if (file.size > LOGO_MAX_BYTES) {
      setSaveError("Logo must be 500 KB or smaller.");
      return;
    }
    try {
      const data = await readDataUrl(file);
      const { w, h } = await measureImage(data);
      if (w < LOGO_PX_MIN || h < LOGO_PX_MIN || w > LOGO_PX_MAX || h > LOGO_PX_MAX) {
        setSaveError(
          `Logo must be ${LOGO_PX_MIN}–${LOGO_PX_MAX} px on both sides (this file is ${w}×${h}).`,
        );
        return;
      }
      patch({ logo: data, logoName: file.name });
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not read the logo file.");
    }
  };

  return (
    <div className={cn(fill ? "flex flex-1 flex-col gap-4" : "space-y-4")}>
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
              hint={LOGO_UPLOAD_HINT}
              onFile={(file) => {
                void handleLogoFile(file);
              }}
              onRemove={() => patch({ logo: "", logoName: "" })}
            />
          </div>
          <div className="space-y-3 rounded-lg border p-4" style={{ borderColor: draft.color }}>
            <div className="text-xs text-muted-foreground">Preview</div>
            <div className="grid gap-4 lg:grid-cols-3">
              <LogoSurfaceColumn
                label="Menu"
                surfaceId="menu"
                logoSize={logoPx(LOGO_BASE_PX.menu, draft.surfaces.menu.scale)}
                draft={draft}
                onChange={patchSurface}
              />
              <LogoSurfaceColumn
                label="Home page"
                surfaceId="home"
                logoSize={logoPx(LOGO_BASE_PX.homeDesktop, draft.surfaces.home.scale)}
                draft={draft}
                onChange={patchSurface}
              />
              <LogoSurfaceColumn
                label="Footer"
                surfaceId="footer"
                logoSize={logoPx(LOGO_BASE_PX.footer, draft.surfaces.footer.scale)}
                draft={draft}
                onChange={patchSurface}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Each well is {LOGO_PREVIEW_BOX_PX}×{LOGO_PREVIEW_BOX_PX} px (home size at 100%).
              Size sliders are 75% to 125% of the current surface size.
            </p>
          </div>
        </div>
      ) : null}

      {subTab === "sky" ? (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Sky animation"
            className="flex min-w-0 flex-1 flex-wrap gap-1 rounded-lg border p-1"
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
            <button
              type="button"
              onClick={() => setSkyFullscreen(true)}
              className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Preview
            </button>
          </div>
          <div
            className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
            style={{ height: "min(42vh, 28rem)", minHeight: 220 }}
          >
            <VersaConstellation
              variant={draft.variant}
              density={draft.density}
              zoom={draft.zoom}
              effects={draft.effects}
              preview
            />
          </div>
          <div className="shrink-0 space-y-2">
            <label className="text-sm font-medium">
              Stars ({Math.round(draft.zoom * 100)}%)
            </label>
            <input
              type="range"
              min={SKY_ZOOM_MIN}
              max={SKY_ZOOM_MAX}
              step={SKY_ZOOM_STEP}
              value={draft.zoom}
              onChange={(e) => patch({ zoom: clampSkyZoom(Number(e.target.value)) })}
              className="w-full"
              style={{ accentColor: draft.color }}
            />
            <p className="text-xs text-muted-foreground">
              25% is a wide night sky (browser zoomed out). 100% is the current
              scale. 200% is close-in. Shooting stars, satellites, asteroids, comets, and aurora keep their own size.
            </p>
          </div>
          <div className="grid shrink-0 gap-3 sm:grid-cols-2">
            <SkyEffectRow
              title="Shooting stars"
              hint="Brief meteors. Independent of Stars zoom. 1× is the usual rate; 3× is the previous rate."
              style={draft.effects.meteors}
              color={draft.color}
              onChange={(partial) => patchEffect("meteors", partial)}
            />
            <SkyEffectRow
              title="Satellites"
              hint="Slow crossings with quiet gaps. Independent of Stars zoom. 1× is the usual rate."
              style={draft.effects.satellites}
              color={draft.color}
              onChange={(partial) => patchEffect("satellites", partial)}
            />
            <SkyEffectRow
              title="Asteroids"
              hint="Tumbling rocks in gold, ice blue, emerald, royal red, or silver. 1× waits 15–60s between appearances."
              style={draft.effects.asteroids}
              color={draft.color}
              onChange={(partial) => patchEffect("asteroids", partial)}
            />
            <SkyEffectRow
              title="Comets"
              hint="Slow nucleus with a long tail. Colors cycle: dust (pale yellow), ion (blue), green coma, sodium (orange). Much slower than a shooting star. 1× waits 20–80s between appearances."
              style={draft.effects.comets}
              color={draft.color}
              onChange={(partial) => patchEffect("comets", partial)}
            />
            <SkyEffectRow
              title="Aurora"
              hint="One to three small soft aurora patches rippling at random spots in the sky for a few seconds. 1× waits 90–360s between appearances."
              style={draft.effects.aurora}
              color={draft.color}
              onChange={(partial) => patchEffect("aurora", partial)}
            />
          </div>
          <div className="shrink-0 space-y-2">
            <label className="text-sm font-medium">
              Density ({skyDensityLevel(draft.density)}×)
            </label>
            <input
              type="range"
              min={SKY_DENSITY_LEVEL_MIN}
              max={SKY_DENSITY_LEVEL_MAX}
              step={1}
              value={skyDensityLevel(draft.density)}
              onChange={(e) => patch({ density: skyDensityFromLevel(Number(e.target.value)) })}
              className="w-full"
              style={{ accentColor: draft.color }}
            />
            <p className="text-xs text-muted-foreground">
              {draft.variant === "classic"
                ? "5× is the original Classic band. 1× is sparse, 10× is twice as rich."
                : "1× is the original Realistic field. At 10× the stars compact into the Classic milky-way band."}
            </p>
          </div>
        </div>
      ) : null}

      {saveError ? (
        <p className="shrink-0 text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}
      {!loaded ? (
        <p className="shrink-0 text-xs text-muted-foreground">Loading…</p>
      ) : null}
      {skyFullscreen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sky animation full screen preview"
          className="fixed inset-0 z-[200] m-0 bg-black"
        >
          <VersaConstellation
            variant={draft.variant}
            density={draft.density}
            zoom={draft.zoom}
            effects={draft.effects}
            preview
          />
          <button
            type="button"
            onClick={() => setSkyFullscreen(false)}
            className="absolute right-4 top-4 z-10 rounded-md border border-white/25 bg-black/50 px-3 py-1.5 text-sm font-medium text-white hover:bg-black/70"
          >
            Close
          </button>
        </div>
      ) : null}

      <Separator className="shrink-0" />
      <div className="flex shrink-0 gap-2">
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
