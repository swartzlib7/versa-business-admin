"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Sphere, Line, Text, Ring, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { theme } from "@/lib/theme";
import {
  businessGraphNodes,
  businessGraphLinks,
  RING_RADII,
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
  if (id === "executive") return theme.scene.hubColor;
  switch (type) {
    case "organization": return theme.scene.organizationColor;
    case "collaboration": return theme.scene.collaborationColor;
    case "environmental": return theme.scene.environmentalColor;
    default: return "#6b7280";
  }
}

function getNodeSize(type: BusinessGraphNode["type"], id?: string): number {
  if (id === "executive") return 0.55;
  switch (type) {
    case "organization": return 0.30;
    case "collaboration": return 0.26;
    case "environmental": return 0.24;
    default: return 0.2;
  }
}

// --- Position calculation ---
// Explicit poses from fixture (from_stephen_02 / I5.5.1). Rings are guides only.

function computePositions(): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  for (const node of businessGraphNodes) {
    positions.set(node.id, node.position);
  }
  return positions;
}

// --- Visible X / Y / Z axes (I5.5.2) - Y-up world ---
// X = red (right +), Y = green (up +), Z = blue (front +)

function AxisGuides({ length = 7.5 }: { length?: number }) {
  const neg = 0.35;
  const labelOff = length + 0.35;
  return (
    <group>
      <Line
        points={[[-neg, 0, 0], [length, 0, 0]]}
        color="#ef4444"
        lineWidth={2}
        transparent
        opacity={0.85}
      />
      <Line
        points={[[0, -neg, 0], [0, length * 0.55, 0]]}
        color="#22c55e"
        lineWidth={2}
        transparent
        opacity={0.85}
      />
      <Line
        points={[[0, 0, -neg], [0, 0, length]]}
        color="#3b82f6"
        lineWidth={2}
        transparent
        opacity={0.85}
      />
      <Billboard position={[labelOff, 0, 0]}>
        <Text fontSize={0.28} color="#ef4444" anchorX="center" anchorY="middle">
          X
        </Text>
      </Billboard>
      <Billboard position={[0, length * 0.55 + 0.25, 0]}>
        <Text fontSize={0.28} color="#22c55e" anchorX="center" anchorY="middle">
          Y
        </Text>
      </Billboard>
      <Billboard position={[0, 0, labelOff]}>
        <Text fontSize={0.28} color="#3b82f6" anchorX="center" anchorY="middle">
          Z
        </Text>
      </Billboard>
    </group>
  );
}

// --- Center Executive node (I5.5.2: middle sphere is Executive, not product brand) ---

function CenterExecutiveNode({
  position,
  pulse,
  palette,
  onClick,
}: {
  position: [number, number, number];
  pulse: boolean;
  palette: ScenePalette;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(t * 2) * (pulse ? 0.08 : 0.04)
      );
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.15);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(t * 1.5) * 0.04;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={glowRef} args={[0.9, 24, 24]}>
        <meshBasicMaterial
          color={theme.scene.hubGlow}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      <Sphere ref={meshRef} args={[0.55, 32, 32]} onClick={onClick}>
        <meshStandardMaterial
          color={theme.scene.hubColor}
          emissive={theme.scene.hubColor}
          emissiveIntensity={pulse ? 1.0 : 0.6}
          roughness={0.2}
          metalness={0.4}
        />
      </Sphere>
      <Billboard position={[0, 1.1, 0]}>
        <Text
          fontSize={0.3}
          color={palette.labelColor}
          anchorX="center"
          anchorY="middle"
        >
          Executive
        </Text>
      </Billboard>
      <Billboard position={[0, 0.75, 0]}>
        <Text
          fontSize={0.16}
          color={palette.labelColor}
          anchorX="center"
          anchorY="middle"
        >
          Organization center
        </Text>
      </Billboard>
    </group>
  );
}

// --- Zone node (department / party / context) ---

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

// --- Organization rim label ---

function OrganizationRimLabel({
  radius,
  palette,
}: {
  radius: number;
  palette: ScenePalette;
}) {
  // Flat label along the edge of the Organization circle
  return (
    <Billboard position={[0, 0, -radius - 0.3]}>
      <Text
        fontSize={0.22}
        color={palette.labelColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.7}
      >
        Organization
      </Text>
    </Billboard>
  );
}

// --- Orbital ring guide ---

function OrbitalRingGuide({
  radius,
  color,
  opacity,
}: {
  radius: number;
  color: string;
  opacity: number;
}) {
  // Wider band so orbital guides read clearly (esp. dark mode)
  return (
    <Ring
      args={[radius - 0.035, radius + 0.035, 96]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    >
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </Ring>
  );
}

// --- Animated connection line ---

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
      matRef.current.opacity = opacity * (0.65 + Math.sin(t * 2) * 0.25);
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

// --- Scene content (inside Canvas) ---

function SceneContent({
  nodes,
  positions,
  focusedNodeId,
  palette,
  onNodeClick,
}: {
  nodes: SceneNode[];
  positions: Map<string, [number, number, number]>;
  focusedNodeId?: string | null;
  palette: ScenePalette;
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

  const centerNode = nodes.find((n) => n.id === "executive")!;
  const centerPos = positions.get("executive")!;

  return (
    <group ref={groupRef}>
      <AxisGuides />

      {[1, 2, 3].map((ring) => (
        <OrbitalRingGuide
          key={"ring-" + ring}
          radius={RING_RADII[ring]}
          color={palette.ringGuideColor}
          opacity={palette.ringGuideOpacity}
        />
      ))}

      {/* Organization rim label */}
      <OrganizationRimLabel radius={RING_RADII[1]} palette={palette} />

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

      <CenterExecutiveNode
        position={centerPos}
        pulse={!!focusedNodeId}
        palette={palette}
        onClick={handleClick(centerNode)}
      />

      {nodes
        .filter((n) => n.id !== "executive")
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
}: MissionControlSceneProps) {
  const dark = useDarkMode();
  const palette = getPalette(dark);

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

  const containerClass = expanded
    ? "fixed inset-0 z-50 bg-background"
    : "relative h-[500px] w-full rounded-lg border border-border overflow-hidden transition-colors";

  return (
    <div
      className={containerClass}
      style={!expanded ? { backgroundColor: palette.background } : undefined}
    >
      <Canvas
        camera={{ position: [8, 6.5, 10], fov: 50 }}
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
          onNodeClick={onNodeClick}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={5}
          maxDistance={22}
          autoRotate
          autoRotateSpeed={0.3}
        />
        <gridHelper
          args={[16, 32, palette.gridMain, palette.gridSub]}
          position={[0, -2.8, 0]}
        />
      </Canvas>

      {/* Legend */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.hubColor }} />
          <span className="text-muted-foreground">Brand</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.organizationColor }} />
          <span className="text-muted-foreground">Organization</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.collaborationColor }} />
          <span className="text-muted-foreground">Collaboration</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.environmentalColor }} />
          <span className="text-muted-foreground">Environmental</span>
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-2 left-3 text-xs text-muted-foreground pointer-events-none">
        {focusedNodeId
          ? "Node selected — see detail below. Drag to orbit, scroll to zoom"
          : "Click a node to focus — drag to orbit, scroll to zoom"}
      </div>
    </div>
  );
}
