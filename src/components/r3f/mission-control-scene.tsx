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

function getNodeSize(type: BusinessGraphNode["type"], id?: string): number {
  if (id === HUB_CENTER_ID) return SPHERE_RADIUS.center;
  switch (type) {
    case "organization": return SPHERE_RADIUS.organization;
    case "collaboration": return SPHERE_RADIUS.collaboration;
    case "environmental": return SPHERE_RADIUS.environmental;
    default: return 0.2;
  }
}

function computePositions(): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  for (const node of businessGraphNodes) {
    positions.set(node.id, node.position);
  }
  return positions;
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

// --- Center Executive node ---

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
      <Billboard position={[0, size + 0.55, 0]}>
        <Text
          fontSize={0.3}
          color={palette.labelColor}
          anchorX="center"
          anchorY="middle"
        >
          Product
        </Text>
      </Billboard>
      <Billboard position={[0, size + 0.22, 0]}>
        <Text
          fontSize={0.16}
          color={palette.labelColor}
          anchorX="center"
          anchorY="middle"
        >
          Operating nucleus
        </Text>
      </Billboard>
    </group>
  );
}

/** Translucent glowing shell around the organization zone - Executive collective (I5.5.5). */
function ExecutiveZoneGlow({ radius }: { radius: number }) {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.03);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.07 + Math.sin(t * 1.2) * 0.025;
    }
  });
  const r = radius * 1.15;
  return (
    <group>
      <Sphere ref={glowRef} args={[r, 48, 48]}>
        <meshBasicMaterial
          color={theme.scene.hubGlow}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>
      <Sphere args={[r * 1.08, 48, 48]}>
        <meshBasicMaterial
          color={theme.scene.hubColor}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>
      <Billboard position={[0, r * 0.85, 0]}>
        <Text
          fontSize={0.22}
          color={theme.scene.hubColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.85}
        >
          Executive
        </Text>
      </Billboard>
      <Billboard position={[0, r * 0.85 - 0.28, 0]}>
        <Text
          fontSize={0.14}
          color={theme.scene.hubColor}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.65}
        >
          Organization zone
        </Text>
      </Billboard>
    </group>
  );
}

// --- Zone node ---

function ZoneNode({
  node,
  position,
  focused,
  palette,
  onClick,
}: {
  node: SceneNode;
  position: [number, number, number];
  focused: boolean;
  palette: ScenePalette;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
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
      <Billboard position={[0, node.size + 0.35, 0]}>
        <Text
          fontSize={0.18}
          color={palette.labelColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          {node.label}
        </Text>
      </Billboard>
    </group>
  );
}

function ZoneRimLabel({
  radius,
  label,
  palette,
}: {
  radius: number;
  label: string;
  palette: ScenePalette;
}) {
  return (
    <Billboard position={[0, 0.05, -radius - 0.35]}>
      <Text
        fontSize={0.2}
        color={palette.labelColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.7}
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
  onNodeClick,
}: {
  nodes: SceneNode[];
  positions: Map<string, [number, number, number]>;
  focusedNodeId?: string | null;
  palette: ScenePalette;
  showAxes: boolean;
  onNodeClick?: (node: SceneNode) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
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

  const zoneMeta: { ring: number; label: string; color: string }[] = [
    { ring: 1, label: "Organization", color: theme.scene.organizationColor },
    { ring: 2, label: "Collaboration", color: theme.scene.collaborationColor },
    { ring: 3, label: "Environmental", color: theme.scene.environmentalColor },
  ];

  return (
    <group ref={groupRef}>
      {showAxes && <AxisGuides />}

      {/* Executive = collective glow around organization zone */}
      <ExecutiveZoneGlow radius={ZONE_RADII[1]} />

      {zoneMeta.map((z) => (
        <group key={"zone-" + z.ring}>
          <ZoneCircles
            radius={ZONE_RADII[z.ring]}
            color={palette.ringGuideColor}
            opacity={palette.ringGuideOpacity}
          />
          <ZoneRimLabel
            radius={ZONE_RADII[z.ring]}
            label={z.label}
            palette={palette}
          />
        </group>
      ))}

      {businessGraphLinks.map((link, i) => {
        const fromPos = positions.get(link.from);
        const toPos = positions.get(link.to);
        if (!fromPos || !toPos) return null;
        const isPrimary = link.type === "primary";
        return (
          <AnimatedConnection
            key={"link-" + i}
            from={fromPos}
            to={toPos}
            color={
              isPrimary
                ? theme.scene.primaryLinkColor
                : palette.secondaryLinkColor
            }
            opacity={
              isPrimary
                ? palette.primaryLinkOpacity
                : palette.secondaryLinkOpacity
            }
            lineWidth={isPrimary ? 1.5 : 2}
            primary={isPrimary}
          />
        );
      })}

      <CenterProductNode
        position={centerPos}
        pulse={!!focusedNodeId}
        palette={palette}
        size={centerNode.size}
        onClick={handleClick(centerNode)}
      />

      {nodes
        .filter((n) => n.id !== HUB_CENTER_ID)
        .map((node) => {
          const pos = positions.get(node.id)!;
          return (
            <ZoneNode
              key={node.id}
              node={node}
              position={pos}
              focused={focusedNodeId === node.id}
              palette={palette}
              onClick={handleClick(node)}
            />
          );
        })}
    </group>
  );
}

// --- Main component ---

export function MissionControlScene({
  onNodeClick,
  focusedNodeId,
  expanded = false,
  showAxes: showAxesProp,
  onShowAxesChange,
}: MissionControlSceneProps) {
  const dark = useDarkMode();
  const palette = getPalette(dark);
  const [internalAxes, setInternalAxes] = useState(true);
  const showAxes = showAxesProp ?? internalAxes;

  const setShowAxes = (next: boolean) => {
    if (showAxesProp === undefined) setInternalAxes(next);
    onShowAxesChange?.(next);
  };

  const positions = useMemo(() => computePositions(), []);

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
      size: getNodeSize(n.type, n.id),
    }));
  }, [positions]);

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
          onNodeClick={onNodeClick}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={5}
          maxDistance={28}
          autoRotate
          autoRotateSpeed={0.3}
        />
        <gridHelper
          args={[AXIS_STEP * 8, 32, palette.gridMain, palette.gridSub]}
          position={[0, -AXIS_STEP * 3.2, 0]}
        />
      </Canvas>

      {/* Chrome: axes toggle always visible (incl. fullscreen) */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAxes(!showAxes)}
          className="rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-muted"
        >
          {showAxes ? "Hide XYZ axes" : "Show XYZ axes"}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-3 rounded-md border border-border bg-background/85 px-3 py-2 text-xs shadow-sm backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.hubColor }} />
          Product / Service
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.organizationColor }} />
          Executive (org zone)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.collaborationColor }} />
          Collaboration
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.environmentalColor }} />
          Environmental
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
