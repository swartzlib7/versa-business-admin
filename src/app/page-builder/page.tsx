"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { useBrand } from "@/components/shell/brand-provider";
import { BrandingPanel, type BrandingSubTab } from "@/components/settings/branding-panel";
import { MenuItemsPanel } from "@/components/settings/menu-items-panel";
import { SkyMasterSwitch } from "@/components/settings/sky-master-switch";
import { PageBuilderPanel } from "@/components/settings/page-builder-panel";
import { PublicSitePanel } from "@/components/settings/public-site-panel";
import { PanelShell } from "@/components/settings/settings-chrome";
import {
  PageBuilderRecordTab,
  type ElementsSubKind,
} from "@/components/settings/page-builder-record-tab";
type PageBuilderTab = "branding" | "canvas" | "menu" | "sky";
type CanvasSubKind = "configuration" | ElementsSubKind;

const TABS: { id: PageBuilderTab; label: string }[] = [
  { id: "branding", label: "Branding" },
  { id: "canvas", label: "Canvas" },
  { id: "menu", label: "Menu" },
  { id: "sky", label: "Sky Animation" },
];

const CANVAS_SUB_TABS: { id: CanvasSubKind; label: string }[] = [
  { id: "configuration", label: "Configuration" },
  { id: "pairings", label: "Elements" },
  { id: "render-drivers", label: "Rendering Drivers" },
];

const TAB_IDS = TABS.map((t) => t.id);
const BRANDING_SUBS = ["brand", "logo", "cycle"] as const;
const CANVAS_SUB_IDS = CANVAS_SUB_TABS.map((t) => t.id);

function isCanvasSub(value: string | null): value is CanvasSubKind {
  return !!value && CANVAS_SUB_IDS.includes(value as CanvasSubKind);
}

function canvasSubFromValue(value: string | null): CanvasSubKind {
  if (value === "elements" || value === "pairings") return "pairings";
  if (isCanvasSub(value)) return value;
  return "configuration";
}

function tabFromSearch(): PageBuilderTab {
  if (typeof window === "undefined") return "canvas";
  const q = new URLSearchParams(window.location.search).get("tab");
  if (q === "cycle-strip") return "branding";
  if (q === "page-builder" || q === "elements" || q === "html-pages") {
    return "canvas";
  }
  if (q && TAB_IDS.includes(q as PageBuilderTab)) return q as PageBuilderTab;
  return "canvas";
}

function subFromSearch(tab: PageBuilderTab): string {
  if (typeof window === "undefined") {
    if (tab === "branding") return "brand";
    if (tab === "menu") return "operator";
    if (tab === "canvas") return "configuration";
    return "configuration";
  }
  const params = new URLSearchParams(window.location.search);
  const qTab = params.get("tab");
  const sub = params.get("sub");
  if (tab === "canvas") {
    if (qTab === "elements") return canvasSubFromValue(sub ?? "pairings");
    if (qTab === "html-pages" || qTab === "cycle-strip") return "configuration";
    return canvasSubFromValue(sub);
  }
  if (tab === "branding") {
    if (qTab === "cycle-strip") return "cycle";
    if (sub && (BRANDING_SUBS as readonly string[]).includes(sub)) return sub;
  }
  if (tab === "menu" && (sub === "operator" || sub === "public")) return sub;
  return tab === "branding" ? "brand" : tab === "menu" ? "operator" : "configuration";
}

function writeSearch(tab: PageBuilderTab, sub: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  if (tab === "branding" && sub !== "brand") url.searchParams.set("sub", sub);
  else if (tab === "menu" && sub !== "operator") url.searchParams.set("sub", sub);
  else if (tab === "canvas" && sub && sub !== "configuration") url.searchParams.set("sub", sub);
  else url.searchParams.delete("sub");
  const next = `${url.pathname}${url.search}`;
  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, "", next);
  }
}

export default function PageBuilderPage() {
  const brand = useBrand();
  const [tab, setTab] = useState<PageBuilderTab>(() => tabFromSearch());
  const [subTab, setSubTab] = useState<string>(() => subFromSearch(tabFromSearch()));

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("tab") === "ui-components" || q.get("sub") === "ui-components") {
      window.location.replace("/glossary?tab=ui-components");
      return;
    }
    if (q.get("tab") === "appearance") {
      window.location.replace("/settings?tab=appearance");
      return;
    }
    writeSearch(tab, subTab);
  }, [tab, subTab]);

  return (
    <AppShell>
      <div className="space-y-3">
        <PageHeader
          title="Page Builder"
          subtitle="Compose visitor canvases from Element records and Rendering Drivers."
          accent={brand.brand_color}
          tabs={TABS}
          tabsValue={tab}
          onTabChange={(id) => {
            const next = id as PageBuilderTab;
            setTab(next);
            if (next === "branding") setSubTab("brand");
            else if (next === "menu") setSubTab("operator");
            else if (next === "canvas") setSubTab("configuration");
            else setSubTab("configuration");
          }}
          tabsAriaLabel="Page Builder sections"
        />

        {tab === "canvas" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={CANVAS_SUB_TABS}
              activeId={canvasSubFromValue(subTab)}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Canvas sub-sections"
            />
            {canvasSubFromValue(subTab) === "configuration" ? (
              <PanelShell
                summary="Plus lists Element records. The Cell stores that Element and a Render output. Create Elements on Canvas → Elements."
                badge="Canvas"
                fill
              >
                <PageBuilderPanel />
              </PanelShell>
            ) : (
              <PageBuilderRecordTab kind={canvasSubFromValue(subTab) as ElementsSubKind} />
            )}
          </div>
        )}

        {tab === "branding" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[
                { id: "brand", label: "Brand" },
                { id: "logo", label: "Logo" },
                { id: "cycle", label: "Cycle Strip" },
              ]}
              activeId={subTab === "logo" || subTab === "cycle" ? subTab : "brand"}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Branding sub-sections"
            />
            {subTab === "cycle" ? (
              <PanelShell
                summary="The six homepage steps beside the logo. Numbers, labels, and descriptions each have a toggle."
                badge="Cycle Strip"
              >
                <PublicSitePanel />
              </PanelShell>
            ) : (
            <PanelShell
              summary="Customize how Versa - Business Admin appears. Name, color, and logo are saved permanently and survive a restart."
              badge="Brand"
            >
              <BrandingPanel
                subTab={(subTab === "logo" ? "logo" : "brand") as BrandingSubTab}
              />
            </PanelShell>
            )}
          </div>
        )}

        {tab === "sky" && (
          <div role="tabpanel" className="space-y-3">
            <PanelShell
              summary="Visitor homepage sky. Variant, zoom, density, and effects are saved permanently and survive a restart."
              badge="Sky"
            >
              <SkyMasterSwitch />
              <BrandingPanel subTab="sky" />
            </PanelShell>
          </div>
        )}

        {tab === "menu" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[
                { id: "operator", label: "Operator" },
                { id: "public", label: "Public" },
              ]}
              activeId={subTab === "public" ? "public" : "operator"}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Menu sub-sections"
            />
            <PanelShell
              summary={
                subTab === "public"
                  ? "Visitor header and footer. Off hides the link and disables the page."
                  : "Operator sidebar. Off hides the item and disables its routes. Settings stays on."
              }
              badge={subTab === "public" ? "Public" : "Operator"}
            >
              <MenuItemsPanel kind={subTab === "public" ? "public" : "operator"} />
            </PanelShell>
          </div>
        )}

      </div>
    </AppShell>
  );
}
