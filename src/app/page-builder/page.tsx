"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { useBrand } from "@/components/shell/brand-provider";
import { BrandingPanel, type BrandingSubTab } from "@/components/settings/branding-panel";
import { MenuItemsPanel } from "@/components/settings/menu-items-panel";
import { PageBuilderPanel } from "@/components/settings/page-builder-panel";
import { AppearancePanel } from "@/components/settings/appearance-panel";
import { PanelShell } from "@/components/settings/settings-chrome";
import {
  ELEMENTS_SUB_TABS,
  PageBuilderRecordTab,
  type ElementsSubKind,
} from "@/components/settings/page-builder-record-tab";
import { TwinSlotProvider, useTwinSlot } from "@/components/zones/twin-slot-context";
import { SpatialTwinPane } from "@/components/zones/spatial-twin-pane";

function CanvasTwinRail() {
  const { preview } = useTwinSlot();
  return (
    <SpatialTwinPane
      zoneId="page-builder"
      hubZone="environment"
      focusedNodeId={null}
      onNodeClick={() => undefined}
      preview={preview}
    />
  );
}

type PageBuilderTab =
  | "canvas"
  | "elements"
  | "branding"
  | "menu"
  | "appearance"
  | "sky";

const TABS: { id: PageBuilderTab; label: string }[] = [
  { id: "canvas", label: "Canvas" },
  { id: "elements", label: "Elements" },
  { id: "branding", label: "Branding" },
  { id: "menu", label: "Menu" },
  { id: "appearance", label: "Appearance" },
  { id: "sky", label: "Sky Animation" },
];

const TAB_IDS = TABS.map((t) => t.id);
const BRANDING_SUBS = ["brand", "logo"] as const;
const ELEMENT_SUB_IDS = ELEMENTS_SUB_TABS.map((t) => t.id);

function isElementsSub(value: string | null): value is ElementsSubKind {
  return !!value && ELEMENT_SUB_IDS.includes(value as ElementsSubKind);
}

function tabFromSearch(): PageBuilderTab {
  if (typeof window === "undefined") return "canvas";
  const q = new URLSearchParams(window.location.search).get("tab");
  if (q === "page-builder") return "canvas";
  if (q === "html-pages" || q === "cycle-strip") return "elements";
  if (q && TAB_IDS.includes(q as PageBuilderTab)) return q as PageBuilderTab;
  return "canvas";
}

function subFromSearch(tab: PageBuilderTab): string {
  if (typeof window === "undefined") {
    if (tab === "branding") return "brand";
    if (tab === "menu") return "operator";
    if (tab === "elements") return "pairings";
    return "configuration";
  }
  const params = new URLSearchParams(window.location.search);
  const qTab = params.get("tab");
  const sub = params.get("sub");
  if (tab === "elements") {
    if (isElementsSub(sub)) return sub;
    return "pairings";
  }
  if (tab === "branding" && sub && (BRANDING_SUBS as readonly string[]).includes(sub)) return sub;
  if (tab === "menu" && (sub === "operator" || sub === "public")) return sub;
  return tab === "branding" ? "brand" : tab === "menu" ? "operator" : "configuration";
}

function writeSearch(tab: PageBuilderTab, sub: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  if (tab === "branding" && sub !== "brand") url.searchParams.set("sub", sub);
  else if (tab === "menu" && sub !== "operator") url.searchParams.set("sub", sub);
  else if (tab === "elements") url.searchParams.set("sub", sub);
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
            else if (next === "elements") setSubTab("pairings");
            else setSubTab("configuration");
          }}
          tabsAriaLabel="Page Builder sections"
        />

        {tab === "canvas" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId="configuration"
              accent={brand.brand_color}
              onSelect={() => undefined}
              ariaLabel="Canvas sub-sections"
            />
            <TwinSlotProvider>
              <div className="flex flex-col items-start gap-3 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <PanelShell
                    summary="Drop an Element type onto a Cell, then configure the record and driver. The Element paints inside the Cell. Click a Cell to preview it in the Spatial Twin."
                    badge="Canvas"
                    fill
                  >
                    <PageBuilderPanel />
                  </PanelShell>
                </div>
                <aside className="w-full shrink-0 lg:w-auto">
                  <CanvasTwinRail />
                </aside>
              </div>
            </TwinSlotProvider>
          </div>
        )}

        {tab === "elements" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={ELEMENTS_SUB_TABS}
              activeId={isElementsSub(subTab) ? subTab : "pairings"}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Element types"
            />
            <PageBuilderRecordTab kind={isElementsSub(subTab) ? subTab : "pairings"} />
          </div>
        )}

        {tab === "branding" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[
                { id: "brand", label: "Brand" },
                { id: "logo", label: "Logo" },
              ]}
              activeId={subTab}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Branding sub-sections"
            />
            <PanelShell
              summary="Customize how Versa - Business Admin appears. Name, color, and logo are saved permanently and survive a restart."
              badge="Brand"
            >
              <BrandingPanel
                subTab={(["brand", "logo"].includes(subTab) ? subTab : "brand") as BrandingSubTab}
              />
            </PanelShell>
          </div>
        )}

        {tab === "sky" && (
          <div role="tabpanel" className="space-y-3">
            <PanelShell
              summary="Visitor homepage sky. Variant, zoom, density, and effects are saved permanently and survive a restart."
              badge="Sky"
            >
              <BrandingPanel subTab="sky" />
            </PanelShell>
          </div>
        )}

        {tab === "appearance" && (
          <div role="tabpanel" className="space-y-3">
            <SubTabBar
              items={[{ id: "configuration", label: "Configuration" }]}
              activeId={subTab}
              accent={brand.brand_color}
              onSelect={setSubTab}
              ariaLabel="Appearance sub-sections"
            />
            <AppearancePanel />
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
