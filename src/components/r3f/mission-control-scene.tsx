"use client";

import { cn } from "@/lib/utils";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Sphere, Line, Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { theme } from "@/lib/theme";
import {
  businessGraphNodes,
  businessGraphLinks,
  ZONE_RADII,
  AXIS_STEP,
  SPHERE_RADIUS,
  HUB_CENTER_ID,
  type BusinessGraphNode,
} from "@/lib/fixtures";

// --- Types ---

export interface SceneNode {
  id: string;
  label: string;
  type: "organization" | "collaboration" | "environmental";
  ring: number;
  description: string;
  status: string;
  pos: [number, number, number];
  color: string;
  size: number;
}

interface MissionControlSceneProps {
  onNodeClick?: (node: SceneNode) => void;
  focusedNodeId?: string | null;
  expanded?: boolean;
  /** Show XYZ axis guides (default true). Parent can control. */
  showAxes?: boolean;
  /** Notify parent when user toggles axes from the scene chrome. */
  onShowAxesChange?: (show: boolean) => void;
  /** Show dotted zone rings (default true). */
  showRings?: boolean;
  onShowRingsChange?: (show: boolean) => void;
  /**
   * When true (default), render in-canvas axes/rings toggles.
   * Set false when parent Mission Control chrome already owns those controls (I5.5.8).
   */
  showCanvasChrome?: boolean;
  /** Orbit animation speed multiplier (1 = default). */
  animSpeed?: number;
  onAnimSpeedChange?: (v: number) => void;
  /** Ring gap multiplier (1 = default zone spacing). */
  ringGap?: number;
  onRingGapChange?: (v: number) => void;
  /** Sphere size multiplier (1 = default). */
  sphereScale?: number;
  onSphereScaleChange?: (v: number) => void;
  /** I5.6.22 — show zone shell / ring tint colors (default true). */
  showZoneColors?: boolean;
  onShowZoneColorsChange?: (show: boolean) => void;
  /** I5.6.22 — show ground gridHelper plane (default true). */
  showFloor?: boolean;
  onShowFloorChange?: (show: boolean) => void;
  /**
   * I5.6.16 — controlled zone visibility (org / collab / env).
   * When set, overrides internal legend state (zone pages show active zone only).
   */
  zoneVisible?: {
    organization: boolean;
    collaboration: boolean;
    environment: boolean;
  };
  /** Show bottom-left zone legend toggles (default true). */
  showLegend?: boolean;
  /** Show top-right view gizmo Front/Left/Angle (default true). */
  showViewGizmo?: boolean;
  /** Show bottom-right camera telemetry readout (default true). */
  showCameraTelemetry?: boolean;
  /** Optional className on outer scene wrapper. */
  className?: string;
  /**
   * I5.6.17 — frame camera so the active zone nearly fills viewport height.
   * organization/collaboration: ~50px top/bottom margin (fill ~0.85).
   * environment: slightly tighter (half remaining edge gap).
   */
  cameraFitZone?: "organization" | "collaboration" | "environment";
}

// --- Theme helpers ---

type ScenePalette = typeof theme.scene.dark | typeof theme.scene.light;

function useDarkMode(): boolean {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return dark;
}

function getPalette(dark: boolean): ScenePalette {
  return dark ? theme.scene.dark : theme.scene.light;
}

function getNodeColor(type: BusinessGraphNode["type"], id?: string): string {
  // I5.5.5: Product (center) + Service use hub executive blue
  if (id === HUB_CENTER_ID || id === "service") return theme.scene.hubColor;
  switch (type) {
    case "organization": return theme.scene.organizationColor;
    case "collaboration": return theme.scene.collaborationColor;
    case "environmental": return theme.scene.environmentalColor;
    default: return "#6b7280";
  }
}

function getNodeSize(
  type: BusinessGraphNode["type"],
  id?: string,
  scale = 1
): number {
  let base: number;
  if (id === HUB_CENTER_ID) base = SPHERE_RADIUS.center;
  else {
    switch (type) {
      case "organization":
        base = SPHERE_RADIUS.organization;
        break;
      case "collaboration":
        base = SPHERE_RADIUS.collaboration;
        break;
      case "environmental":
        base = SPHERE_RADIUS.environmental;
        break;
      default:
        base = 0.2;
    }
  }
  return base * scale;
}

/** Scale fixture positions by ring gap (radial distance from origin). */
function computePositions(
  ringGap = 1
): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  for (const node of businessGraphNodes) {
    const [x, y, z] = node.position;
    positions.set(node.id, [x * ringGap, y * ringGap, z * ringGap]);
  }
  return positions;
}

function zoneRadii(ringGap = 1): [number, number, number, number] {
  return [
    0,
    AXIS_STEP * ringGap,
    AXIS_STEP * 2 * ringGap,
    AXIS_STEP * 3 * ringGap,
  ];
}

// --- Visible X / Y / Z axes (I5.5.2/3) — Y-up; length tracks outer zone ---

function AxisGuides({ length = AXIS_STEP * 3.2 }: { length?: number }) {
  const neg = length * 0.08;
  const labelOff = length + 0.4;
  return (
    <group>
      <Line
        points={[[-neg, 0, 0], [length, 0, 0]]}
        color="#ef4444"
        lineWidth={2}
        transparent
        opacity={0.9}
      />
      <Line
        points={[[0, -neg, 0], [0, length, 0]]}
        color="#22c55e"
        lineWidth={2}
        transparent
        opacity={0.9}
      />
      <Line
        points={[[0, 0, -neg], [0, 0, length]]}
        color="#3b82f6"
        lineWidth={2}
        transparent
        opacity={0.9}
      />
      <Billboard position={[labelOff, 0, 0]}>
        <Text fontSize={0.32} color="#ef4444" anchorX="center" anchorY="middle">
          X
        </Text>
      </Billboard>
      <Billboard position={[0, labelOff, 0]}>
        <Text fontSize={0.32} color="#22c55e" anchorX="center" anchorY="middle">
          Y
        </Text>
      </Billboard>
      <Billboard position={[0, 0, labelOff]}>
        <Text fontSize={0.32} color="#3b82f6" anchorX="center" anchorY="middle">
          Z
        </Text>
      </Billboard>
    </group>
  );
}

// --- Intersecting zone circles on three planes (I5.5.3) ---
// XY (horizontal top-down), XZ (front), YZ (side) — one set per zone radius.

function circlePoints(
  radius: number,
  plane: "xy" | "xz" | "yz",
  segments = 96
): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a) * radius;
    const sn = Math.sin(a) * radius;
    if (plane === "xy") pts.push([c, sn, 0]);
    else if (plane === "xz") pts.push([c, 0, sn]);
    else pts.push([0, c, sn]);
  }
  return pts;
}

/** Intersecting zone circles — lighter gray, dotted, ~50% opacity (I5.5.4). */
function ZoneCircles({
  radius,
  color,
  opacity,
}: {
  radius: number;
  color: string;
  opacity: number;
}) {
  const planes: Array<"xy" | "xz" | "yz"> = ["xy", "xz", "yz"];
  return (
    <group>
      {planes.map((plane) => (
        <Line
          key={plane}
          points={circlePoints(radius, plane)}
          color={color}
          lineWidth={1.25}
          transparent
          opacity={opacity}
          dashed
          dashSize={0.18}
          gapSize={0.14}
          depthWrite={false}
        />
      ))}
    </group>
  );
}

// --- Center Product node (I5.5.6) ---

function CenterProductNode({
  position,
  pulse,
  palette,
  size,
  onClick,
}: {
  position: [number, number, number];
  pulse: boolean;
  palette: ScenePalette;
  size: number;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(t * 2) * (pulse ? 0.08 : 0.04)
      );
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={onClick}
        onPointerOver={() => {
          if (onClick) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          color={theme.scene.hubColor}
          emissive={theme.scene.hubColor}
          emissiveIntensity={pulse ? 1.0 : 0.6}
          roughness={0.2}
          metalness={0.4}
        />
      </Sphere>
      <Billboard position={[0, size + 0.35, 0]}>
        <Text
          fontSize={0.18}
          color={palette.labelColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          Product
        </Text>
      </Billboard>
    </group>
  );
}

/** I5.6.8 — single static red translucent shell (no dual red/blue pulse). */
function ExecutiveZoneGlow({
  orgRadius,
  serviceY,
  onLabelClick,
  selected = false,
  showShell = true,
}: {
  orgRadius: number;
  serviceY: number;
  /** Only the Executive label is tappable (I5.5.9). */
  onLabelClick?: (e: ThreeEvent<MouseEvent>) => void;
  /** I5.6.21/22 — selection on Executive label (brackets only; no font/outline change). */
  selected?: boolean;
  /** I5.6.22 — zone color shell */
  showShell?: boolean;
}) {
  const r = orgRadius * 1.15;
  // I5.6.21 — single label (removed duplicate "Organization Zone")
  const labelY = serviceY * 0.5;
  // I5.6.22 — brackets only; keep same font size/color as unselected
  const labelText = selected ? "[ Executive ]" : "Executive";

  return (
    <group>
      {showShell && (
      <Sphere args={[r, 48, 48]}>
        <meshBasicMaterial
          color={theme.scene.executiveGlow ?? theme.scene.executiveColor}
          transparent
          opacity={0.09}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Sphere>
      )}
      <Billboard position={[0, labelY, 0]}>
        <Text
          fontSize={0.22}
          color={theme.scene.executiveColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.95}
          onClick={onLabelClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          {labelText}
        </Text>
      </Billboard>
    </group>
  );
}

/** I5.6.8 — collaboration zone shell independent of Executive (was wrongly the outer blue of org glow). */
function CollaborationZoneCloud({ collabRadius }: { collabRadius: number }) {
  const r = collabRadius * 1.02;
  return (
    <Sphere args={[r, 48, 48]}>
      <meshBasicMaterial
        color={theme.scene.collaborationColor}
        transparent
        opacity={0.055}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </Sphere>
  );
}

/** I5.6.5 — gray cloud shell for Environment zone (matches org/collab cloud treatment). */
function EnvironmentZoneCloud({
  envRadius,
  animate = true,
}: {
  envRadius: number;
  animate?: boolean;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!animate || !glowRef.current) return;
    const t = state.clock.getElapsedTime();
    glowRef.current.scale.setScalar(1 + Math.sin(t * 0.9) * 0.02);
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.045 + Math.sin(t * 0.9) * 0.015;
  });
  const r = envRadius * 1.02;
  return (
    <Sphere ref={glowRef} args={[r, 48, 48]}>
      <meshBasicMaterial
        color="#9ca3af"
        transparent
        opacity={0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </Sphere>
  );
}

// --- Zone node ---

/** Label that stays on top of the sphere in world-Y even when parent group spins (I5.5.11). */
function SphereTopLabel({
  size,
  label,
  palette,
}: {
  size: number;
  label: string;
  palette: ScenePalette;
}) {
  const ref = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());
  const localPos = useRef(new THREE.Vector3());

  useFrame(() => {
    const g = ref.current;
    if (!g?.parent) return;
    g.parent.getWorldPosition(worldPos.current);
    localPos.current.set(
      worldPos.current.x,
      worldPos.current.y + size + 0.35,
      worldPos.current.z
    );
    g.parent.worldToLocal(localPos.current);
    g.position.copy(localPos.current);
  });

  return (
    <group ref={ref}>
      <Billboard>
        <Text
          fontSize={0.18}
          color={palette.labelColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

function ZoneNode({
  node,
  position,
  focused,
  palette,
  onClick,
  hideLabel = false,
}: {
  node: SceneNode;
  position: [number, number, number];
  focused: boolean;
  palette: ScenePalette;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  /** When true, sphere only — label rendered elsewhere. */
  hideLabel?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && focused) {
      const t = state.clock.getElapsedTime();
      meshRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[focused ? node.size * 1.35 : node.size, 24, 24]}
        onClick={onClick}
        onPointerOver={() => {
          if (onClick) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={focused ? 0.9 : 0.35}
          roughness={0.3}
          metalness={0.2}
        />
      </Sphere>
      {!hideLabel && (
        <SphereTopLabel size={node.size} label={node.label} palette={palette} />
      )}
    </group>
  );
}

/** World-fixed label at the top of a sphere's rest position (does not orbit). */
function FixedTopLabel({
  position,
  label,
  size,
  palette,
}: {
  position: [number, number, number];
  label: string;
  size: number;
  palette: ScenePalette;
}) {
  const [x, y, z] = position;
  return (
    <Billboard position={[x, y + size + 0.4, z]}>
      <Text
        fontSize={0.18}
        color={palette.labelColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
      >
        {label}
      </Text>
    </Billboard>
  );
}

/** Zone name label — bottom-left center of each ring quadrant in front view (I5.6.3). */
function ZoneMidLabel({
  midRadius,
  label,
  color,
}: {
  midRadius: number;
  label: string;
  color: string;
}) {
  // Front view: +X right, +Y up. Bottom-left quadrant center at 225 deg on XY.
  const k = Math.SQRT1_2; // 1/sqrt(2)
  const x = -midRadius * k;
  const y = -midRadius * k;
  return (
    <Billboard position={[x, y, 0.08]}>
      <Text
        fontSize={0.22}
        color={color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
      >
        {label}
      </Text>
    </Billboard>
  );
}

function AnimatedConnection({
  from,
  to,
  color,
  opacity,
  lineWidth,
  primary,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  opacity: number;
  lineWidth: number;
  primary?: boolean;
}) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  useFrame((state) => {
    if (matRef.current && primary) {
      const t = state.clock.getElapsedTime();
      matRef.current.opacity = opacity * (0.75 + 0.25 * Math.sin(t * 2));
    }
  });

  return (
    <Line
      points={[from, to]}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      dashed={!primary}
      dashSize={primary ? undefined : 0.25}
      gapSize={primary ? undefined : 0.12}
    >
      <lineBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </Line>
  );
}

function SceneContent({
  nodes,
  positions,
  focusedNodeId,
  palette,
  showAxes,
  showRings,
  showZoneColors,
  animSpeed,
  ringGap,
  zoneVisible,
  onNodeClick,
}: {
  nodes: SceneNode[];
  positions: Map<string, [number, number, number]>;
  focusedNodeId?: string | null;
  palette: ScenePalette;
  showAxes: boolean;
  showRings: boolean;
  showZoneColors: boolean;
  animSpeed: number;
  ringGap: number;
  zoneVisible: { organization: boolean; collaboration: boolean; environment: boolean };
  onNodeClick?: (node: SceneNode) => void;
}) {
  // I5.6.12: collab CB Y-orbit ±x; VP X-spin +π/2; env KS Y-orbit ±z; EL Z-spin @ 2w
  // I5.6.24: EL orbit radius scale >1 so XY path never meets KS XZ path on ±x (phase alone cannot prevent that)
  const collabHorizRef = useRef<THREE.Group>(null);
  const collabVpRef = useRef<THREE.Group>(null);
  const envKsRef = useRef<THREE.Group>(null);
  const envElRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // I5.6.4: collab base rate w; environment runs at 2w (two env revs per collab rev)
    const w = 0.05 * animSpeed;
    const wEnv = w * 2;
    // Customer + Branch: horizontal orbit (Y) — ring in XZ plane; rest ±x
    if (collabHorizRef.current) {
      collabHorizRef.current.rotation.y = t * w;
    }
    // Vendor + Partner: perpendicular X-spin; +π/2 phase => effective rest ±z
    if (collabVpRef.current) {
      collabVpRef.current.rotation.x = -t * w + Math.PI / 2;
    }
    // Knowledge + Schedules: horizontal Y — rest ±z (XZ plane)
    if (envKsRef.current) {
      envKsRef.current.rotation.y = -t * wEnv;
    }
    // Events + Locations: Z-spin (XY plane). Phase kept at −π/2; clearance is via radius scale (I5.6.24).
    if (envElRef.current) {
      envElRef.current.rotation.z = t * wEnv - Math.PI / 2;
    }
  });

  const handleClick = useCallback(
    (node: SceneNode) => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const centerNode = nodes.find((n) => n.id === HUB_CENTER_ID)!;
  const centerPos = positions.get(HUB_CENTER_ID)!;
  const radii = zoneRadii(ringGap);

  const executiveNode: SceneNode = useMemo(
    () => ({
      id: "executive",
      label: "Executive",
      type: "organization",
      ring: 1,
      description:
        "Business executive function - collective name for the organization zone.",
      status: "active",
      pos: [0, 0, 0],
      color: theme.scene.executiveColor,
      size: centerNode.size,
    }),
    [centerNode.size]
  );

  const orgNodes = nodes.filter(
    (n) => n.id !== HUB_CENTER_ID && n.ring === 1
  );
  const collabHorizNodes = nodes.filter(
    (n) => n.id === "customer" || n.id === "branch"
  );
  const collabVpNodes = nodes.filter(
    (n) => n.id === "vendor" || n.id === "partner"
  );
  const envKsNodes = nodes.filter(
    (n) => n.id === "knowledge" || n.id === "schedules"
  );
  const envElNodes = nodes.filter(
    (n) => n.id === "events" || n.id === "locations"
  );

  const servicePos = positions.get("service");
  const serviceY = servicePos ? servicePos[1] : radii[1];

  // I5.5.12/13: zone ring colors + labels midway between rings; Environment (not Environment)
  const zoneMeta: {
    ring: number;
    label: string;
    color: string;
    midRadius: number;
  }[] = [
    {
      ring: 1,
      label: "Organization",
      color: theme.scene.executiveColor,
      midRadius: (0 + radii[1]) / 2,
    },
    {
      ring: 2,
      label: "Collaboration",
      color: theme.scene.collaborationColor,
      midRadius: (radii[1] + radii[2]) / 2,
    },
    {
      ring: 3,
      label: "Environment",
      color: theme.scene.environmentalColor,
      midRadius: (radii[2] + radii[3]) / 2,
    },
  ];

  // I5.6.24 — EL (Events/Locations) orbit on a larger radius than KS so the
  // XY Z-spin path never intersects the XZ Y-orbit path (equal radii always
  // meet on ±x regardless of phase).
  const ENV_EL_ORBIT_SCALE = 1.28;

  const renderNode = (node: SceneNode, hideLabel = false, orbitScale = 1) => {
    const base = positions.get(node.id)!;
    const pos: [number, number, number] =
      orbitScale === 1
        ? base
        : [base[0] * orbitScale, base[1] * orbitScale, base[2] * orbitScale];
    return (
      <ZoneNode
        key={node.id}
        node={node}
        position={pos}
        focused={focusedNodeId === node.id}
        palette={palette}
        onClick={handleClick(node)}
        hideLabel={hideLabel}
      />
    );
  };

  const ringVisible = (ring: number) => {
    if (ring === 1) return zoneVisible.organization;
    if (ring === 2) return zoneVisible.collaboration;
    if (ring === 3) return zoneVisible.environment;
    return true;
  };

  return (
    <>
      <group>
        {showAxes && <AxisGuides length={AXIS_STEP * 3.2 * ringGap} />}

        {zoneVisible.organization && (
          <ExecutiveZoneGlow
            orgRadius={radii[1]}
            serviceY={serviceY}
            onLabelClick={handleClick(executiveNode)}
            selected={focusedNodeId === "executive"}
            showShell={showZoneColors}
          />
        )}

        {zoneVisible.collaboration && showZoneColors && (
          <CollaborationZoneCloud collabRadius={radii[2]} />
        )}

        {zoneVisible.environment && showZoneColors && (
          <EnvironmentZoneCloud
            envRadius={radii[3]}
            animate={animSpeed > 0}
          />
        )}

        {showRings &&
          zoneMeta
            .filter((z) => ringVisible(z.ring))
            .map((z) => (
              <group key={"zone-static-" + z.ring}>
                <ZoneCircles
                  radius={radii[z.ring]}
                  color={showZoneColors ? z.color : palette.labelColor}
                  opacity={palette.ringGuideOpacity}
                />
                <ZoneMidLabel
                  midRadius={z.midRadius}
                  label={z.label}
                  color={showZoneColors ? z.color : palette.labelColor}
                />
              </group>
            ))}

        {/* I5.6.7: Product is part of Executive/Organization zone — hide with zone toggle */}
        {zoneVisible.organization && (
          <>
            <CenterProductNode
              position={centerPos}
              pulse={focusedNodeId === HUB_CENTER_ID}
              palette={palette}
              size={centerNode.size}
              onClick={handleClick(centerNode)}
            />
            {orgNodes.map((n) => renderNode(n))}
          </>
        )}
      </group>

      {/* Collab: Customer/Branch horizontal Y; Vendor/Partner perp X (I5.5.15) */}
      {zoneVisible.collaboration && (
        <>
          <group ref={collabHorizRef}>
            {collabHorizNodes.map((n) => renderNode(n))}
          </group>
          <group ref={collabVpRef}>
            {collabVpNodes.map((n) => renderNode(n))}
          </group>
        </>
      )}

      {/* Env: KS Y-orbit ±z @ ring3; EL Z-spin @ ring3×1.28 (I5.6.24 clearance) */}
      {zoneVisible.environment && (
        <>
          <group ref={envKsRef}>{envKsNodes.map((n) => renderNode(n))}</group>
          <group ref={envElRef}>
            {envElNodes.map((n) => renderNode(n, false, ENV_EL_ORBIT_SCALE))}
          </group>
        </>
      )}
    </>
  );
}


/** I5.6.20 — keep orbit pivot locked on product sphere center (origin).
 *  Standard OrbitControls pan moves target with the camera, which shifts the
 *  rotation point and makes the model look distorted. After each controls
 *  update we snap target back to the product center so RMB pan trucks the
 *  camera while look-at (and next orbit) stay on the hub. */
function OrbitPivotLock({
  controlsRef,
  target = DEFAULT_CAM_TARGET,
}: {
  controlsRef: React.RefObject<any>;
  target?: [number, number, number];
}) {
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls?.target) return;
    const [x, y, z] = target;
    if (
      controls.target.x !== x ||
      controls.target.y !== y ||
      controls.target.z !== z
    ) {
      controls.target.set(x, y, z);
      controls.update();
    }
  });
  return null;
}

// --- Camera telemetry (I5.6.1) - live pos / target / zoom for default-view capture ---

const CAM_MIN_DIST = 5;
const CAM_MAX_DIST = 28;
/** I5.6.3 — Stephen default view (pos rounded ~0.1 from capture; lookAt origin; dist 28; fov 50) */
const DEFAULT_CAM_POS: [number, number, number] = [-11.4, 9.0, 23.9];
const DEFAULT_CAM_TARGET: [number, number, number] = [0, 0, 0];
const DEFAULT_CAM_FOV = 50;
/** Anim speed cycle: off, 1, 5, 10, 15, 20 (I5.6.3) */
const ANIM_SPEED_STEPS = [0, 1, 5, 10, 15, 20];

/**
 * I5.6.17 — per-zone framing for zone-page embeds.
 * Uses zone ring radius (glow/cloud bulk) + vertical FOV fill factor.
 * Org/Collab: nearly fill height (~50px margin on ~600px → fill 0.85).
 * Env: already close — half remaining gap → fill ~0.92.
 */
const ZONE_CAMERA_FIT: Record<
  "organization" | "collaboration" | "environment",
  { radius: number; fill: number }
> = {
  // I5.6.18 — Stephen: org/env ~25% less zoomed-in, collab ~10% less
  organization: { radius: ZONE_RADII[1], fill: 0.68 }, // was 0.85 / 1.25
  collaboration: { radius: ZONE_RADII[2], fill: 0.773 }, // was 0.85 / 1.10
  environment: { radius: ZONE_RADII[3], fill: 0.736 }, // was 0.92 / 1.25
};

function fitDistanceForZone(
  zone: "organization" | "collaboration" | "environment",
  fovDeg = DEFAULT_CAM_FOV
): number {
  const { radius, fill } = ZONE_CAMERA_FIT[zone];
  const halfFov = ((fovDeg * Math.PI) / 180) / 2;
  const targetHalf = halfFov * fill;
  const dist = radius / Math.tan(targetHalf);
  // Keep within orbit range (allow slightly under default min for small org sphere)
  return Math.min(CAM_MAX_DIST, Math.max(3.5, dist));
}

function fitCameraPosition(
  zone: "organization" | "collaboration" | "environment"
): [number, number, number] {
  const dist = fitDistanceForZone(zone);
  const base = new THREE.Vector3(
    DEFAULT_CAM_POS[0],
    DEFAULT_CAM_POS[1],
    DEFAULT_CAM_POS[2]
  );
  if (base.lengthSq() < 1e-6) {
    return [0, dist * 0.35, dist];
  }
  base.normalize().multiplyScalar(dist);
  return [base.x, base.y, base.z];
}

export type CameraTelemetry = {
  pos: [number, number, number];
  target: [number, number, number];
  /** Distance from camera to orbit target (= zoom proxy for OrbitControls) */
  distance: number;
  minDistance: number;
  maxDistance: number;
  /** 0 at furthest (maxDistance), 1 at nearest (minDistance) */
  zoomNorm: number;
  fov: number;
};

function CameraTelemetryReporter({
  controlsRef,
  onUpdate,
}: {
  controlsRef: React.RefObject<any>;
  onUpdate: (t: CameraTelemetry) => void;
}) {
  const last = useRef(0);
  useFrame(() => {
    const now = performance.now();
    if (now - last.current < 100) return;
    last.current = now;
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object as THREE.PerspectiveCamera;
    if (!cam) return;
    const target = controls.target as THREE.Vector3;
    const dist = cam.position.distanceTo(target);
    const span = CAM_MAX_DIST - CAM_MIN_DIST;
    const zoomNorm = span > 0 ? (CAM_MAX_DIST - dist) / span : 0;
    onUpdate({
      pos: [
        round3(cam.position.x),
        round3(cam.position.y),
        round3(cam.position.z),
      ],
      target: [round3(target.x), round3(target.y), round3(target.z)],
      distance: round3(dist),
      minDistance: CAM_MIN_DIST,
      maxDistance: CAM_MAX_DIST,
      zoomNorm: round3(Math.min(1, Math.max(0, zoomNorm))),
      fov: round3(cam.fov),
    });
  });
  return null;
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

function fmtVec(v: [number, number, number]) {
  return v.map((n) => n.toFixed(3)).join(", ");
}

// --- Main component ---


export function MissionControlScene({
  onNodeClick,
  focusedNodeId,
  expanded = false,
  showAxes: showAxesProp,
  onShowAxesChange,
  showRings: showRingsProp,
  onShowRingsChange,
  showCanvasChrome = true,
  animSpeed: animSpeedProp,
  onAnimSpeedChange,
  ringGap: ringGapProp,
  onRingGapChange,
  sphereScale: sphereScaleProp,
  onSphereScaleChange,
  showZoneColors: showZoneColorsProp,
  onShowZoneColorsChange,
  showFloor: showFloorProp,
  onShowFloorChange,
  zoneVisible: zoneVisibleProp,
  showLegend = true,
  showViewGizmo = true,
  showCameraTelemetry = true,
  className,
  cameraFitZone,
}: MissionControlSceneProps) {
  const dark = useDarkMode();
  const palette = getPalette(dark);
  const [internalAxes, setInternalAxes] = useState(false); // I5.6.3 hide axes by default
  const [internalRings, setInternalRings] = useState(true);
  const [internalSpeed, setInternalSpeed] = useState(1);
  const [internalGap, setInternalGap] = useState(1);
  const [internalSphere, setInternalSphere] = useState(1);
  const [internalZoneColors, setInternalZoneColors] = useState(true);
  const [internalFloor, setInternalFloor] = useState(true);
  // I5.6.5 — legend toggles show/hide each zone (overridden when zoneVisible prop set)
  const [internalZoneVisible, setInternalZoneVisible] = useState({
    organization: true,
    collaboration: true,
    environment: true,
  });
  const zoneVisible = zoneVisibleProp ?? internalZoneVisible;
  const toggleZone = (key: keyof typeof internalZoneVisible) => {
    if (zoneVisibleProp) return; // controlled — no internal toggle
    setInternalZoneVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const showAxes = showAxesProp ?? internalAxes;
  const showRings = showRingsProp ?? internalRings;
  const animSpeed = animSpeedProp ?? internalSpeed;
  const ringGap = ringGapProp ?? internalGap;
  const sphereScale = sphereScaleProp ?? internalSphere;
  const showZoneColors = showZoneColorsProp ?? internalZoneColors;
  const showFloor = showFloorProp ?? internalFloor;
  const controlsRef = useRef<any>(null);
  const [camTel, setCamTel] = useState<CameraTelemetry | null>(null);
  const onCamTel = useCallback((t: CameraTelemetry) => setCamTel(t), []);

  /** I5.5.13 / I5.6.3 view gizmo: Front, Left, Angle (= Stephen default) */
  const setCameraView = (view: "front" | "left" | "tlf") => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object as THREE.PerspectiveCamera;
    const dist = CAM_MAX_DIST;
    let pos: [number, number, number];
    switch (view) {
      case "front":
        pos = [0, 2, dist];
        break;
      case "left":
        pos = [-dist, 2, 0];
        break;
      case "tlf":
      default:
        pos = [...DEFAULT_CAM_POS];
        break;
    }
    cam.position.set(pos[0], pos[1], pos[2]);
    controls.target.set(
      DEFAULT_CAM_TARGET[0],
      DEFAULT_CAM_TARGET[1],
      DEFAULT_CAM_TARGET[2]
    );
    controls.update();
  };

  // Apply Stephen default camera once OrbitControls mounts (I5.6.3)
  // I5.6.3 default view; I5.6.17 optional per-zone fit for embeds
  useEffect(() => {
    const apply = () => {
      const controls = controlsRef.current;
      if (!controls) return false;
      const cam = controls.object as THREE.PerspectiveCamera;
      if (!cam) return false;
      const pos = cameraFitZone
        ? fitCameraPosition(cameraFitZone)
        : DEFAULT_CAM_POS;
      cam.position.set(pos[0], pos[1], pos[2]);
      cam.fov = DEFAULT_CAM_FOV;
      cam.updateProjectionMatrix();
      controls.target.set(
        DEFAULT_CAM_TARGET[0],
        DEFAULT_CAM_TARGET[1],
        DEFAULT_CAM_TARGET[2]
      );
      // Allow closer orbit when framing small org zone
      if (cameraFitZone === "organization") {
        controls.minDistance = 3.5;
      }
      controls.update();
      return true;
    };
    let frames = 0;
    let raf = 0;
    const tick = () => {
      frames += 1;
      if (apply() || frames > 30) return;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cameraFitZone]);

  const setShowAxes = (next: boolean) => {
    if (showAxesProp === undefined) setInternalAxes(next);
    onShowAxesChange?.(next);
  };

  const setShowRings = (next: boolean) => {
    if (showRingsProp === undefined) setInternalRings(next);
    onShowRingsChange?.(next);
  };

  const setShowZoneColors = (next: boolean) => {
    if (showZoneColorsProp === undefined) setInternalZoneColors(next);
    onShowZoneColorsChange?.(next);
  };

  const setShowFloor = (next: boolean) => {
    if (showFloorProp === undefined) setInternalFloor(next);
    onShowFloorChange?.(next);
  };

  const cycleSpeed = () => {
    const steps = ANIM_SPEED_STEPS;
    const i = steps.indexOf(animSpeed);
    const next = steps[(i >= 0 ? i + 1 : 1) % steps.length];
    if (animSpeedProp === undefined) setInternalSpeed(next);
    onAnimSpeedChange?.(next);
  };

  const cycleGap = () => {
    const steps = [0.75, 1, 1.25, 1.5];
    const i = steps.indexOf(ringGap);
    const next = steps[(i >= 0 ? i + 1 : 1) % steps.length];
    if (ringGapProp === undefined) setInternalGap(next);
    onRingGapChange?.(next);
  };

  const cycleSphere = () => {
    const steps = [0.75, 1, 1.25, 1.5];
    const i = steps.indexOf(sphereScale);
    const next = steps[(i >= 0 ? i + 1 : 1) % steps.length];
    if (sphereScaleProp === undefined) setInternalSphere(next);
    onSphereScaleChange?.(next);
  };

  const positions = useMemo(() => computePositions(ringGap), [ringGap]);

  const nodes: SceneNode[] = useMemo(() => {
    return businessGraphNodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      ring: n.ring,
      description: n.description,
      status: n.status,
      pos: positions.get(n.id) || [0, 0, 0],
      color: getNodeColor(n.type, n.id),
      size: getNodeSize(n.type, n.id, sphereScale),
    }));
  }, [positions, sphereScale]);

  // When used inside a parent fullscreen shell, fill the parent (h-full).
  // When standalone expanded, cover the viewport.
  // I5.6.16/20: className lets zone pages fill a column (h-full); default hub height 750px (I5.6.20 +50%).
  const containerClass = cn(
    expanded
      ? "relative h-full w-full min-h-[750px] overflow-hidden"
      : "relative h-[750px] w-full rounded-lg border border-border overflow-hidden transition-colors",
    className
  );

  return (
    <div
      className={containerClass}
      style={{ backgroundColor: palette.background }}
    >
      <Canvas
        camera={{
          position: cameraFitZone
            ? fitCameraPosition(cameraFitZone)
            : DEFAULT_CAM_POS,
          fov: DEFAULT_CAM_FOV,
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={palette.ambientIntensity} />
        <pointLight position={[10, 10, 10]} intensity={palette.pointLightIntensity} />
        <pointLight position={[-10, -5, -10]} intensity={0.4} color={theme.scene.hubColor} />
        <SceneContent
          nodes={nodes}
          positions={positions}
          focusedNodeId={focusedNodeId}
          palette={palette}
          showAxes={showAxes}
          showRings={showRings}
          showZoneColors={showZoneColors}
          animSpeed={animSpeed}
          ringGap={ringGap}
          zoneVisible={zoneVisible}
          onNodeClick={onNodeClick}
        />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={CAM_MIN_DIST}
          maxDistance={CAM_MAX_DIST}
          autoRotate={false}
          enablePan
          screenSpacePanning
          // I5.6.20 — product sphere is always the orbit center
          target={DEFAULT_CAM_TARGET}
          // Prevent extreme polar flip that reads as model distortion
          minPolarAngle={0.12}
          maxPolarAngle={Math.PI - 0.12}
        />
        <OrbitPivotLock controlsRef={controlsRef} target={DEFAULT_CAM_TARGET} />
        <CameraTelemetryReporter controlsRef={controlsRef} onUpdate={onCamTel} />
        {showFloor && (
          <gridHelper
            args={[AXIS_STEP * 8, 32, palette.gridMain, palette.gridSub]}
            position={[0, -AXIS_STEP * 3.2, 0]}
          />
        )}
      </Canvas>

      {/* Canvas chrome — omit when parent Mission Control already has controls (I5.5.8) */}
      {showCanvasChrome && (
        <div className="absolute top-3 left-3 right-3 z-20 flex max-w-full flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAxes(!showAxes)}
            className="rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-muted"
          >
            {showAxes ? "Hide XYZ axes" : "Show XYZ axes"}
          </button>
          <button
            type="button"
            onClick={() => setShowRings(!showRings)}
            className="rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-muted"
          >
            {showRings ? "Hide rings" : "Show rings"}
          </button>
          <button
            type="button"
            onClick={() => setShowZoneColors(!showZoneColors)}
            className="rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-muted"
          >
            {showZoneColors ? "Hide zone colors" : "Show zone colors"}
          </button>
          <button
            type="button"
            onClick={() => setShowFloor(!showFloor)}
            className="rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-muted"
          >
            {showFloor ? "Hide grid floor" : "Show grid floor"}
          </button>
          <button
            type="button"
            onClick={cycleSpeed}
            className="rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-muted"
          >
            Speed {animSpeed === 0 ? "off" : animSpeed + "x"}
          </button>
          <button
            type="button"
            onClick={cycleGap}
            className="rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-muted"
          >
            Gap {ringGap}x
          </button>
          <button
            type="button"
            onClick={cycleSphere}
            className="rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-muted"
          >
            Spheres {sphereScale}x
          </button>
        </div>
      )}

      {/* I5.5.13 view gizmo — top right */}
      {showViewGizmo && (
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 rounded-md border border-border bg-background/90 p-1.5 shadow-sm backdrop-blur">
        <span className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          View
        </span>
        <button
          type="button"
          onClick={() => setCameraView("front")}
          className="rounded border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
          title="Front view"
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setCameraView("left")}
          className="rounded border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
          title="Left view"
        >
          Left
        </button>
        <button
          type="button"
          onClick={() => setCameraView("tlf")}
          className="rounded border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
          title="Top-left-front angled view"
        >
          Angle
        </button>
      </div>
      )}

      {/* I5.6.1 camera / zoom readout - for Stephen to capture default view */}
      {showCameraTelemetry && (
      <div className="absolute bottom-3 right-3 z-20 max-w-[min(100%,20rem)] rounded-md border border-border bg-background/90 px-3 py-2 font-mono text-[10px] leading-relaxed shadow-sm backdrop-blur">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-sans font-semibold uppercase tracking-wide text-muted-foreground">
            Camera
          </span>
          <span className="font-sans text-[10px] text-muted-foreground">
            live - default capture
          </span>
        </div>
        {camTel ? (
          <div className="space-y-0.5 text-foreground">
            <div>
              <span className="text-muted-foreground">pos </span>
              {fmtVec(camTel.pos)}
            </div>
            <div>
              <span className="text-muted-foreground">lookAt </span>
              {fmtVec(camTel.target)}
            </div>
            <div>
              <span className="text-muted-foreground">dist </span>
              {camTel.distance.toFixed(3)}
              <span className="text-muted-foreground">
                {" "}
                (zoom {camTel.zoomNorm.toFixed(3)} - 0=far 1=near)
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">range </span>
              min {camTel.minDistance.toFixed(1)} - max {camTel.maxDistance.toFixed(1)}
              <span className="text-muted-foreground"> - fov </span>
              {camTel.fov.toFixed(1)}
            </div>
            <div className="pt-1 font-sans text-[9px] text-muted-foreground">
              Furthest zoom = max dist {camTel.maxDistance}; nearest = min dist{" "}
              {camTel.minDistance}. Rotate/zoom then read pos + dist for default.
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">Waiting for camera...</div>
        )}
      </div>
      )}

      {/* Legend — I5.6.5: clickable show/hide per zone */}
      {showLegend && (
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 rounded-md border border-border bg-background/85 px-2 py-2 text-xs shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => toggleZone("organization")}
          className={
            "flex items-center gap-1.5 rounded-md border px-2 py-1 transition-opacity hover:bg-muted " +
            (zoneVisible.organization
              ? "border-border opacity-100"
              : "border-dashed border-muted-foreground/40 opacity-45")
          }
          title={
            zoneVisible.organization
              ? "Hide Organization zone"
              : "Show Organization zone"
          }
          aria-pressed={zoneVisible.organization}
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{
              background:
                "linear-gradient(to right, " +
                theme.scene.executiveColor +
                " 50%, " +
                theme.scene.hubColor +
                " 50%)",
            }}
          />
          Executive
        </button>
        <button
          type="button"
          onClick={() => toggleZone("collaboration")}
          className={
            "flex items-center gap-1.5 rounded-md border px-2 py-1 transition-opacity hover:bg-muted " +
            (zoneVisible.collaboration
              ? "border-border opacity-100"
              : "border-dashed border-muted-foreground/40 opacity-45")
          }
          title={
            zoneVisible.collaboration
              ? "Hide Collaboration zone"
              : "Show Collaboration zone"
          }
          aria-pressed={zoneVisible.collaboration}
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: theme.scene.collaborationColor }}
          />
          Collaboration
        </button>
        <button
          type="button"
          onClick={() => toggleZone("environment")}
          className={
            "flex items-center gap-1.5 rounded-md border px-2 py-1 transition-opacity hover:bg-muted " +
            (zoneVisible.environment
              ? "border-border opacity-100"
              : "border-dashed border-muted-foreground/40 opacity-45")
          }
          title={
            zoneVisible.environment
              ? "Hide Environment zone"
              : "Show Environment zone"
          }
          aria-pressed={zoneVisible.environment}
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: theme.scene.environmentalColor }}
          />
          Environment
        </button>
        {showAxes && (
          <span className="flex items-center gap-2 px-1 text-muted-foreground">
            <span className="text-[#ef4444]">X</span>
            <span className="text-[#22c55e]">Y</span>
            <span className="text-[#3b82f6]">Z</span>
          </span>
        )}
      </div>
      )}
    </div>
  );
}
