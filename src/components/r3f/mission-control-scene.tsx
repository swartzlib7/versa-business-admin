"use client";

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
      <Sphere ref={meshRef} args={[size, 32, 32]} onClick={onClick}>
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

function ExecutiveZoneGlow({
  orgRadius,
  collabRadius,
  serviceY,
  onLabelClick,
}: {
  /** Inner pulsing glow — organization zone. */
  orgRadius: number;
  /** Outer static shell — reaches collaboration ring (I5.5.9). */
  collabRadius: number;
  serviceY: number;
  /** Only the Executive label is tappable (I5.5.9). */
  onLabelClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.03);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.07 + Math.sin(t * 1.2) * 0.025;
    }
  });
  const innerR = orgRadius * 1.15;
  const outerR = collabRadius * 1.02;
  const labelY = serviceY * 0.5;

  return (
    <group>
      {/* Inner pulse — visual only, not a hit target */}
      <Sphere ref={glowRef} args={[innerR, 48, 48]}>
        <meshBasicMaterial
          color={theme.scene.executiveGlow}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Sphere>
      {/* Outer shell on collab ring — blue (I5.5.11); inner stays red */}
      <Sphere args={[outerR, 48, 48]}>
        <meshBasicMaterial
          color={theme.scene.organizationColor}
          transparent
          opacity={0.035}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Sphere>
      {/* Executive label — sole tap target for Executive focus */}
      <Billboard position={[0, labelY + 0.14, 0]}>
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
          Executive
        </Text>
      </Billboard>
      <Billboard position={[0, labelY - 0.14, 0]}>
        <Text
          fontSize={0.14}
          color={theme.scene.executiveColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.7}
        >
          Organization Zone
        </Text>
      </Billboard>
    </group>
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

/** Zone name label at radial midpoint between rings (I5.5.13). */
function ZoneMidLabel({
  midRadius,
  label,
  color,
}: {
  midRadius: number;
  label: string;
  color: string;
}) {
  return (
    <Billboard position={[0, 0.08, -midRadius]}>
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
  animSpeed,
  ringGap,
  onNodeClick,
}: {
  nodes: SceneNode[];
  positions: Map<string, [number, number, number]>;
  focusedNodeId?: string | null;
  palette: ScenePalette;
  showAxes: boolean;
  showRings: boolean;
  animSpeed: number;
  ringGap: number;
  onNodeClick?: (node: SceneNode) => void;
}) {
  // I5.5.12: collab +Y; KS horizontal Y (same family as collab, opposite);
  // EL X-spin vertical — perpendicular ring to KS; labels world-up; zone ring colors
  const collabRef = useRef<THREE.Group>(null);
  const envKsRef = useRef<THREE.Group>(null);
  const envElRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const w = 0.05 * animSpeed;
    if (collabRef.current) {
      collabRef.current.rotation.y = t * w;
    }
    // Knowledge + Schedules: horizontal orbit (Y) — ring in XZ plane
    if (envKsRef.current) {
      envKsRef.current.rotation.y = -t * w;
    }
    // Events + Locations: vertical up/down on perpendicular ring (X) — YZ plane
    if (envElRef.current) {
      envElRef.current.rotation.x = t * w;
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
  const collabNodes = nodes.filter((n) => n.ring === 2);
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

  const renderNode = (node: SceneNode, hideLabel = false) => {
    const pos = positions.get(node.id)!;
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

  return (
    <>
      <group>
        {showAxes && <AxisGuides length={AXIS_STEP * 3.2 * ringGap} />}

        <ExecutiveZoneGlow
          orgRadius={radii[1]}
          collabRadius={radii[2]}
          serviceY={serviceY}
          onLabelClick={handleClick(executiveNode)}
        />

        {showRings &&
          zoneMeta.map((z) => (
            <group key={"zone-static-" + z.ring}>
              <ZoneCircles
                radius={radii[z.ring]}
                color={z.color}
                opacity={palette.ringGuideOpacity}
              />
              <ZoneMidLabel
                midRadius={z.midRadius}
                label={z.label}
                color={z.color}
              />
            </group>
          ))}

        <CenterProductNode
          position={centerPos}
          pulse={
            focusedNodeId === HUB_CENTER_ID || focusedNodeId === "executive"
          }
          palette={palette}
          size={centerNode.size}
          onClick={handleClick(centerNode)}
        />

        {orgNodes.map((n) => renderNode(n))}
      </group>

      <group ref={collabRef}>{collabNodes.map((n) => renderNode(n))}</group>

      {/* KS: horizontal Y orbit; EL: perpendicular vertical X (I5.5.12) */}
      <group ref={envKsRef}>{envKsNodes.map((n) => renderNode(n))}</group>
      <group ref={envElRef}>{envElNodes.map((n) => renderNode(n))}</group>
    </>
  );
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
}: MissionControlSceneProps) {
  const dark = useDarkMode();
  const palette = getPalette(dark);
  const [internalAxes, setInternalAxes] = useState(true);
  const [internalRings, setInternalRings] = useState(true);
  const [internalSpeed, setInternalSpeed] = useState(1);
  const [internalGap, setInternalGap] = useState(1);
  const [internalSphere, setInternalSphere] = useState(1);
  const showAxes = showAxesProp ?? internalAxes;
  const showRings = showRingsProp ?? internalRings;
  const animSpeed = animSpeedProp ?? internalSpeed;
  const ringGap = ringGapProp ?? internalGap;
  const sphereScale = sphereScaleProp ?? internalSphere;
  const controlsRef = useRef<any>(null);

  /** I5.5.13 view gizmo presets: Front, Left, Top-left-front angled */
  const setCameraView = (view: "front" | "left" | "tlf") => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = controls.object as THREE.PerspectiveCamera;
    const dist = 16;
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
        pos = [-dist * 0.7, dist * 0.65, dist * 0.7];
        break;
    }
    cam.position.set(pos[0], pos[1], pos[2]);
    controls.target.set(0, 0, 0);
    controls.update();
  };

  const setShowAxes = (next: boolean) => {
    if (showAxesProp === undefined) setInternalAxes(next);
    onShowAxesChange?.(next);
  };

  const setShowRings = (next: boolean) => {
    if (showRingsProp === undefined) setInternalRings(next);
    onShowRingsChange?.(next);
  };

  const cycleSpeed = () => {
    const steps = [0.5, 1, 2, 4, 6, 8, 10, 0];
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
  const containerClass = expanded
    ? "relative h-full w-full min-h-[500px] overflow-hidden"
    : "relative h-[500px] w-full rounded-lg border border-border overflow-hidden transition-colors";

  return (
    <div
      className={containerClass}
      style={{ backgroundColor: palette.background }}
    >
      <Canvas
        camera={{ position: [10, 8, 12], fov: 50 }}
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
          animSpeed={animSpeed}
          ringGap={ringGap}
          onNodeClick={onNodeClick}
        />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.1}
          minDistance={5}
          maxDistance={28}
          autoRotate={false}
        />
        <gridHelper
          args={[AXIS_STEP * 8, 32, palette.gridMain, palette.gridSub]}
          position={[0, -AXIS_STEP * 3.2, 0]}
        />
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

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-3 rounded-md border border-border bg-background/85 px-3 py-2 text-xs shadow-sm backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.hubColor }} />
          Product / Service
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.executiveColor }} />
          Executive (org zone)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.collaborationColor }} />
          Collaboration
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.environmentalColor }} />
          Environment
        </span>
        {showAxes && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="text-[#ef4444]">X</span>
            <span className="text-[#22c55e]">Y</span>
            <span className="text-[#3b82f6]">Z</span>
          </span>
        )}
      </div>
    </div>
  );
}
