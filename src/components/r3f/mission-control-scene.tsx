"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Sphere, Line, Text, Ring } from "@react-three/drei";
import * as THREE from "three";
import { theme } from "@/lib/theme";
import {
  businessGraphNodes,
  businessGraphLinks,
  type BusinessGraphNode,
} from "@/lib/fixtures";

// --- Types ---

export interface SceneNode {
  id: string;
  label: string;
  type: "hub" | "system" | "team" | "surface";
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

function getNodeColor(type: BusinessGraphNode["type"]): string {
  switch (type) {
    case "hub": return theme.scene.hubColor;
    case "system": return theme.scene.systemColor;
    case "team": return theme.scene.teamColor;
    case "surface": return theme.scene.surfaceColor;
    default: return "#6b7280";
  }
}

function getNodeSize(type: BusinessGraphNode["type"]): number {
  switch (type) {
    case "hub": return 0.55;
    case "system": return 0.28;
    case "team": return 0.24;
    case "surface": return 0.22;
    default: return 0.2;
  }
}

// --- Position calculation ---

const RING_RADII = [0, 2.8, 4.6, 6.4];

function computePositions(): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  const ringNodes = [1, 2, 3].map((ring) =>
    businessGraphNodes.filter((n) => n.ring === ring)
  );

  positions.set("hub", [0, 0, 0]);

  ringNodes.forEach((nodes, idx) => {
    const radius = RING_RADII[idx + 1];
    const count = nodes.length;
    nodes.forEach((node, i) => {
      const theta = (i / count) * Math.PI * 2 - Math.PI / 2;
      positions.set(node.id, [
        Math.cos(theta) * radius,
        0,
        Math.sin(theta) * radius,
      ]);
    });
  });

  return positions;
}

// --- Hub node ---

function HubNode({
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
      <Text
        position={[0, 1.1, 0]}
        fontSize={0.3}
        color={palette.labelColor}
        anchorX="center"
        anchorY="middle"
      >
        {theme.scene.hubName}
      </Text>
      <Text
        position={[0, 0.75, 0]}
        fontSize={0.16}
        color={palette.labelColor}
        anchorX="center"
        anchorY="middle"
      >
        {theme.scene.hubSubtitle}
      </Text>
    </group>
  );
}

// --- Ring node ---

function RingNode({
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
      meshRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
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
      <Text
        position={[0, node.size + 0.35, 0]}
        fontSize={0.18}
        color={palette.labelColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
      >
        {node.label}
      </Text>
    </group>
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

  const hubNode = nodes.find((n) => n.type === "hub")!;
  const hubPos = positions.get("hub")!;

  return (
    <group ref={groupRef}>
      {[1, 2, 3].map((ring) => (
        <OrbitalRingGuide
          key={"ring-" + ring}
          radius={RING_RADII[ring]}
          color={palette.ringGuideColor}
          opacity={palette.ringGuideOpacity}
        />
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

      <HubNode
        position={hubPos}
        pulse={!!focusedNodeId}
        palette={palette}
        onClick={handleClick(hubNode)}
      />

      {nodes
        .filter((n) => n.type !== "hub")
        .map((node) => {
          const pos = positions.get(node.id)!;
          return (
            <RingNode
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
      color: getNodeColor(n.type),
      size: getNodeSize(n.type),
    }));
  }, [positions]);

  return (
    <div
      className="relative h-[500px] w-full rounded-lg border border-border overflow-hidden transition-colors"
      style={{ backgroundColor: palette.background }}
    >
      <Canvas
        camera={{ position: [7, 5, 9], fov: 50 }}
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
          maxDistance={18}
          autoRotate
          autoRotateSpeed={0.3}
        />
        <gridHelper
          args={[16, 32, palette.gridMain, palette.gridSub]}
          position={[0, -3.5, 0]}
        />
      </Canvas>

      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.hubColor }} />
          <span className="text-muted-foreground">Hub</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.systemColor }} />
          <span className="text-muted-foreground">Systems</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.teamColor }} />
          <span className="text-muted-foreground">Teams</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.scene.surfaceColor }} />
          <span className="text-muted-foreground">Surfaces</span>
        </div>
      </div>

      <div className="absolute bottom-2 left-3 text-xs text-muted-foreground pointer-events-none">
        {focusedNodeId
          ? "Node selected - see detail below. Drag to orbit, scroll to zoom"
          : "Click a node to focus - drag to orbit, scroll to zoom"}
      </div>
    </div>
  );
}
