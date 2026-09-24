"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Maximize2,
  Orbit,
  X,
} from "lucide-react";
import { BusinessAdminScene } from "@/components/r3f/business-admin-scene";
import {
  GRAPH_LAYOUTS,
  StatGraphTwinPreview,
  type GraphLayout,
} from "@/components/statistics/stat-graph-twin-preview";
import { outputIdFromTiles, tilesFromOutputId } from "@/lib/public/render-drivers";
import { hasSpatialTwin } from "@/lib/zones/spatial-twin";
import type { TwinPreview } from "@/components/zones/twin-slot-context";
import { CanvasSlotDriver } from "@/components/public/canvas-slot-drivers";
import { cn } from "@/lib/utils";

/** Footer chrome shared by the Lightbox and Full 3D Hub buttons (same design, side by side). */
const TWIN_FOOTER_BUTTON =
  "items-center gap-1.5 rounded border border-border bg-background/35 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/50";

/**
 * System standard: one Spatial Twin slot per zone listing. The listing
 * publishes TwinPreview (Statistics is the template). Hub spheres show the
 * 3D twin. Types not on the graph use this same slot for a feature preview.
 * Do not mount a second pane inside an expanded row.
 */
export function SpatialTwinPane({
  zoneId,
  hubZone,
  focusedNodeId,
  onNodeClick,
  preview,
  paneId,
}: {
  zoneId: string;
  hubZone: "organization" | "collaboration" | "environment";
  focusedNodeId: string | null;
  onNodeClick: (node: { id: string }) => void;
  preview: TwinPreview;
  /** Override the pane DOM id (the mobile float dock mounts a second pane per zone). */
  paneId?: string;
}) {
  const showScene = hasSpatialTwin(focusedNodeId);
  const [lightbox, setLightbox] = useState(false);
  const [layout, setLayout] = useState<GraphLayout>(1);
  const [page, setPage] = useState(0);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const closeLightbox = useCallback(() => setLightbox(false), []);
  const isStat = preview?.kind === "stat-graph";
  const previewOutput = preview && "renderOutput" in preview ? preview.renderOutput : undefined;
  const previewHeader = preview?.kind === "stat-graph" ? (preview.headerId ?? "") : "";
  const [boundHeader, setBoundHeader] = useState(previewHeader);
  if (boundHeader !== previewHeader) {
    setBoundHeader(previewHeader);
    setLayout(tilesFromOutputId(previewOutput));
    setPage(0);
  }

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setPage((p) => p + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  return (
    <div
      id={paneId ?? `spatial-twin-drawer-${zoneId}`}
      className="flex w-full shrink-0 flex-col lg:w-[465px]"
    >
      <div className="relative overflow-hidden rounded-lg border border-border">
        <TwinBody
          showScene={showScene}
          hubZone={hubZone}
          focusedNodeId={focusedNodeId}
          onNodeClick={onNodeClick}
          preview={preview}
          layout={layout}
          page={page}
          onPageChange={setPage}
          sceneClassName="h-[415px] rounded-none border-0"
          previewClassName="h-[415px] bg-card/40"
        />
        {isStat && !showScene ? (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-md border border-border bg-background/35 p-1.5 shadow-sm backdrop-blur-sm">
            <GraphChrome
              layout={layout}
              onLayout={(n) => {
                setLayout(n);
                if (preview?.kind === "stat-graph") preview.onRenderOutput?.(outputIdFromTiles(n));
              }}
              page={page}
              onPage={setPage}
            />
          </div>
        ) : null}
      </div>
      {/*
        Footer rules (Stephen, 2026-09-13 23:22 + 2026-09-14 02:48 + 03:06):
        - EVERY twin gets the Lightbox button in the footer — the top-right
          button is gone. One consistent pattern for zone and non-zone twins.
        - Real 3D hub twins (business-graph scene, zone twins only) ALSO get a
          [Full 3D Hub] button -> /dashboard, sitting next to the Lightbox
          button in the same chrome (icon + text). Non-zone previews never
          link to the hub.
        - Below lg (phone/tablet) the floating dock already opens the twin
          full-screen/full-width, so the lightbox trigger stays hidden there
          (Stephen, 2026-09-14 02:25). Full-bleed lightbox styles remain as
          fallback. The hub button is navigation, so it stays on phones.
        - Label text is centered under the box (Stephen, 2026-09-14 02:48).
      */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>
          {showScene ? "Spatial Twin · click spheres" : "Spatial Twin · preview"}
        </span>
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className={cn(TWIN_FOOTER_BUTTON, "max-lg:hidden lg:inline-flex")}
          title="Open in a lightbox"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Lightbox
        </button>
        {showScene ? (
          <Link
            href="/dashboard"
            className={cn(TWIN_FOOTER_BUTTON, "inline-flex")}
            title="Open the full 3D hub"
          >
            <Orbit className="h-3.5 w-3.5" />
            Full 3D Hub
          </Link>
        ) : null}
      </div>

      {lightbox && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 max-lg:p-0"
              role="dialog"
              aria-modal="true"
              aria-label="Spatial Twin lightbox"
              onClick={closeLightbox}
            >
              <div
                className="relative h-[90vh] w-[90vw] overflow-hidden rounded-lg border border-border bg-background shadow-lg max-lg:h-full max-lg:w-full max-lg:rounded-none max-lg:border-0"
                onClick={(e) => e.stopPropagation()}
              >
                <TwinBody
                  showScene={showScene}
                  hubZone={hubZone}
                  focusedNodeId={focusedNodeId}
                  onNodeClick={onNodeClick}
                  preview={preview}
                  layout={layout}
                  page={page}
                  onPageChange={setPage}
                  sceneClassName="h-full rounded-none border-0"
                  previewClassName="h-full bg-card/40"
                  showViewGizmo={showScene}
                  lightbox
                />
                <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-md border border-border bg-background/35 p-1.5 shadow-sm backdrop-blur-sm">
                  {isStat && !showScene ? (
                    <GraphChrome
                      layout={layout}
                      onLayout={(n) => {
                        setLayout(n);
                        if (preview?.kind === "stat-graph") preview.onRenderOutput?.(outputIdFromTiles(n));
                      }}
                      page={page}
                      onPage={setPage}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="flex items-center gap-1.5 rounded border border-border bg-background/35 px-2.5 py-1 text-xs font-medium hover:bg-muted/50"
                    title="Close lightbox"
                  >
                    <X className="h-3.5 w-3.5" />
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function TwinBody({
  showScene,
  hubZone,
  focusedNodeId,
  onNodeClick,
  preview,
  layout = 1,
  page = 0,
  onPageChange,
  sceneClassName,
  previewClassName,
  showViewGizmo = false,
  lightbox = false,
}: {
  showScene: boolean;
  hubZone: "organization" | "collaboration" | "environment";
  focusedNodeId: string | null;
  onNodeClick: (node: { id: string }) => void;
  preview: TwinPreview;
  layout?: GraphLayout;
  page?: number;
  onPageChange?: (page: number) => void;
  sceneClassName: string;
  previewClassName: string;
  showViewGizmo?: boolean;
  lightbox?: boolean;
}) {
  if (showScene) {
    return (
      <BusinessAdminScene
        className={sceneClassName}
        showCanvasChrome={false}
        showLegend={false}
        showViewGizmo={showViewGizmo}
        showCameraTelemetry={false}
        showAxes={false}
        ringsMode="50"
        animSpeed={0}
        ringGap={1}
        sphereScale={1}
        cameraFitZone={hubZone}
        zoneVisible={{
          organization: hubZone === "organization",
          collaboration: hubZone === "collaboration",
          environment: hubZone === "environment",
        }}
        focusedNodeId={focusedNodeId}
        onNodeClick={onNodeClick}
      />
    );
  }
  if (preview?.kind === "stat-graph") {
    return (
      <div className={previewClassName}>
        <StatGraphTwinPreview
          key={preview.headerId ?? "stat-graph"}
          values={preview.values}
          headerId={preview.headerId}
          lines={preview.lines}
          layout={layout}
          page={page}
          onPageChange={onPageChange}
          lightbox={lightbox}
        />
      </div>
    );
  }
  if (preview?.kind === "canvas-driver") {
    return (
      <div className={`${previewClassName} overflow-auto p-3`}>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
          {preview.label || preview.driver}
        </p>
        <div className="origin-top-left scale-[0.85]" style={{ width: "117%" }}>
          <CanvasSlotDriver
            driver={preview.driver}
            cycleSteps={preview.cycleSteps ?? []}
            stat={null}
            html={preview.html}
            pageCard={preview.pageCard}
            contact={preview.contact}
            integration={preview.integration}
            schedule={preview.schedule}
            inspection={preview.inspection}
            project={preview.project}
            renderOutput={preview.renderOutput}
          />
        </div>
        {preview.note ? (
          <p className="mt-3 text-xs text-muted-foreground">{preview.note}</p>
        ) : null}
      </div>
    );
  }
  return (
    <div className={`flex items-center p-3 ${previewClassName}`}>
      <p className="text-sm text-muted-foreground">
        No spatial twin for this element. A preview appears here when the
        surface provides one.
      </p>
    </div>
  );
}

function GraphChrome({
  layout,
  onLayout,
  page,
  onPage,
}: {
  layout: GraphLayout;
  onLayout: (n: GraphLayout) => void;
  page: number;
  onPage: (n: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onPage(Math.max(0, page - 1))}
        className="rounded border border-border bg-background/35 p-1 hover:bg-muted/50"
        title="Previous graph page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        className="rounded border border-border bg-background/35 p-1 hover:bg-muted/50"
        title="Next graph page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <span className="mx-0.5 h-4 w-px bg-border" />
      {GRAPH_LAYOUTS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => {
            onLayout(n);
            onPage(0);
          }}
          className={cn(
            "rounded border px-1.5 py-0.5 text-[10px] font-medium",
            layout === n
              ? "border-foreground/40 bg-background/60"
              : "border-border bg-background/35 hover:bg-muted/50",
          )}
          title={`${n} graph${n === 1 ? "" : "s"} on the grid`}
        >
          {n}
        </button>
      ))}
    </>
  );
}

const FLOAT_STORAGE_PREFIX = "mc.spatialTwinFloat.";
const FLOAT_EVENT = "mc:twin-float";

/**
 * away = twin pushed out of view. Backed by localStorage (remembered per
 * zone) through useSyncExternalStore: no setState-in-effect, hydration uses
 * the away-by-default server snapshot, and cross-tab changes stay in sync.
 */
function useTwinFloatAway(zoneId: string): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handler = () => onStoreChange();
    window.addEventListener("storage", handler);
    window.addEventListener(FLOAT_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(FLOAT_EVENT, handler);
    };
  }, []);
  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(FLOAT_STORAGE_PREFIX + zoneId) !== "open";
    } catch {
      return true;
    }
  }, [zoneId]);
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

/**
 * Mobile spatial twin (Stephen, 2026-09-13 23:22): on phones the twin does
 * not render below the page content. It docks as a floating sheet peeking
 * from the bottom with a clearly-visible handle on the right edge. Tap or
 * drag the handle to pull the twin onto the screen; tap or drag it back
 * down to push the twin out of view and keep reading the page. The
 * open/away state is remembered between visits, per zone.
 */
export function FloatTwinDock({
  zoneId,
  hubZone,
  focusedNodeId,
  onNodeClick,
  preview,
}: {
  zoneId: string;
  hubZone: "organization" | "collaboration" | "environment";
  focusedNodeId: string | null;
  onNodeClick: (node: { id: string }) => void;
  preview: TwinPreview;
}) {
  const away = useTwinFloatAway(zoneId);
  const [dims, setDims] = useState({ total: 480, strip: 44 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    baseOffset: number;
    moved: boolean;
  } | null>(null);

  const hiddenOffset = Math.max(0, dims.total - dims.strip);

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const strip = el.firstElementChild;
      setDims({
        total: el.offsetHeight,
        strip: strip instanceof HTMLElement ? strip.offsetHeight : 44,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const commitOpen = useCallback(
    (open: boolean) => {
      try {
        localStorage.setItem(
          FLOAT_STORAGE_PREFIX + zoneId,
          open ? "open" : "away",
        );
        window.dispatchEvent(new Event(FLOAT_EVENT));
      } catch {
        /* ignore */
      }
    },
    [zoneId],
  );

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      baseOffset: away ? hiddenOffset : 0,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = containerRef.current;
    if (!drag || !el || drag.pointerId !== e.pointerId) return;
    const delta = drag.startY - e.clientY;
    if (Math.abs(delta) > 6) drag.moved = true;
    const next = Math.min(hiddenOffset, Math.max(0, drag.baseOffset + delta));
    el.style.transform = "translateY(" + next + "px)";
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = containerRef.current;
    dragRef.current = null;
    if (!drag || !el || drag.pointerId !== e.pointerId) return;
    if (!drag.moved) {
      commitOpen(away); // tap toggles
      return;
    }
    const delta = drag.startY - e.clientY;
    const next = Math.min(hiddenOffset, Math.max(0, drag.baseOffset + delta));
    commitOpen(next < hiddenOffset / 2);
  };

  const offset = away ? hiddenOffset : 0;

  return (
    <div
      ref={containerRef}
      data-away={away ? "1" : "0"}
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ transform: "translateY(" + offset + "px)" }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!away}
        aria-controls={"spatial-twin-drawer-mobile-" + zoneId}
        aria-label={away ? "Show spatial twin" : "Hide spatial twin"}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            commitOpen(away);
          }
        }}
        className="flex h-11 cursor-grab touch-none items-center justify-end pr-3 active:cursor-grabbing"
      >
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-md">
          {away ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          Spatial twin
        </span>
      </div>
      <div className="rounded-t-xl border border-b-0 border-border bg-background p-2 shadow-2xl">
        <SpatialTwinPane
          zoneId={zoneId}
          hubZone={hubZone}
          focusedNodeId={focusedNodeId}
          onNodeClick={onNodeClick}
          preview={preview}
          paneId={"spatial-twin-drawer-mobile-" + zoneId}
        />
      </div>
    </div>
  );
}
