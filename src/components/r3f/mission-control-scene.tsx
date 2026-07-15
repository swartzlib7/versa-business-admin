'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { AgentFixture } from '@/lib/fixtures/agents';
import type { ProjectFixture } from '@/lib/fixtures/projects';

export interface SceneNode {
  id: string;
  label: string;
  type: 'agent' | 'project';
  status: string;
  pos: [number, number, number];
  color: string;
  size: number;
}

interface MissionControlSceneProps {
  agents: AgentFixture[];
  projects: ProjectFixture[];
  onNodeClick?: (node: SceneNode) => void;
  focusedNodeId?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  idle: '#eab308',
  error: '#ef4444',
  offline: '#6b7280',
  paused: '#f59e0b',
  archived: '#6b7280',
};

function NodeCluster({
  nodes,
  onNodeClick,
  focusedNodeId,
}: {
  nodes: SceneNode[];
  onNodeClick?: (node: SceneNode) => void;
  focusedNodeId?: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.06;
    }
  });

  const handleClick = useCallback(
    (node: SceneNode) => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  return (
    <group ref={groupRef}>
      {nodes.map((node) => {
        const isFocused = focusedNodeId === node.id;
        return (
          <group key={node.id}>
            <Sphere
              args={[isFocused ? node.size * 1.4 : node.size, 24, 24]}
              position={node.pos}
              onClick={handleClick(node)}
            >
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isFocused ? 1.0 : 0.4}
                roughness={0.3}
                metalness={0.2}
              />
            </Sphere>
            <Text
              position={[node.pos[0], node.pos[1] + node.size + 0.3, node.pos[2]]}
              fontSize={0.18}
              color="#a1a1aa"
              anchorX="center"
              anchorY="middle"
              maxWidth={2}
            >
              {node.label}
            </Text>
          </group>
        );
      })}
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => {
          const dist = Math.sqrt(
            (a.pos[0] - b.pos[0]) ** 2 +
            (a.pos[1] - b.pos[1]) ** 2 +
            (a.pos[2] - b.pos[2]) ** 2
          );
          if (dist > 4) return null;
          return (
            <Line
              key={`${i}-${j}`}
              points={[a.pos, b.pos]}
              color="#6366f1"
              lineWidth={0.5}
              transparent
              opacity={0.12}
            />
          );
        })
      )}
    </group>
  );
}

function CentralSphere({ pulse }: { pulse: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(state.clock.getElapsedTime() * 2) * (pulse ? 0.08 : 0.03)
      );
    }
  });

  return (
    <Sphere ref={meshRef} args={[0.5, 32, 32]} position={[0, 0, 0]}>
      <meshStandardMaterial
        color="#6366f1"
        emissive="#6366f1"
        emissiveIntensity={pulse ? 1.0 : 0.6}
        roughness={0.2}
        metalness={0.3}
      />
    </Sphere>
  );
}

export function MissionControlScene({
  agents,
  projects,
  onNodeClick,
  focusedNodeId,
}: MissionControlSceneProps) {
  const nodes: SceneNode[] = useMemo(() => {
    const result: SceneNode[] = [];
    const total = agents.length + projects.length;

    agents.forEach((agent, i) => {
      const theta = (i / total) * Math.PI * 2;
      const radius = 2.2 + (i % 3) * 0.8;
      const y = (i % 2 === 0 ? 1 : -1) * (1 + (i % 3) * 0.5);
      result.push({
        id: agent.id,
        label: agent.name.split(' ')[0],
        type: 'agent',
        status: agent.status,
        pos: [Math.cos(theta) * radius, y, Math.sin(theta) * radius],
        color: STATUS_COLORS[agent.status] || '#6b7280',
        size: 0.15,
      });
    });

    projects.forEach((project, i) => {
      const theta = ((agents.length + i) / total) * Math.PI * 2;
      const radius = 3.0 + (i % 2) * 0.6;
      const y = (i % 2 === 0 ? -1 : 1) * (0.8 + i * 0.4);
      result.push({
        id: project.id,
        label: project.name.slice(0, 8),
        type: 'project',
        status: project.status,
        pos: [Math.cos(theta) * radius, y, Math.sin(theta) * radius],
        color:
          project.status === 'active'
            ? '#3b82f6'
            : project.status === 'paused'
            ? '#f59e0b'
            : '#6b7280',
        size: 0.2,
      });
    });

    return result;
  }, [agents, projects]);

  return (
    <div className="relative h-[400px] w-full rounded-lg border border-border bg-black/5 dark:bg-black/20 overflow-hidden">
      <Canvas
        camera={{ position: [6, 3, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#6366f1" />
        <CentralSphere pulse={!!focusedNodeId} />
        <NodeCluster
          nodes={nodes}
          onNodeClick={onNodeClick}
          focusedNodeId={focusedNodeId}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={4}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.3}
        />
        <gridHelper args={[10, 20, '#333', '#222']} position={[0, -3, 0]} />
      </Canvas>
      <div className="absolute bottom-2 left-3 text-xs text-muted-foreground pointer-events-none">
        {focusedNodeId
          ? 'Node selected — see detail below. Drag to orbit, scroll to zoom'
          : 'Click a node to focus — drag to orbit, scroll to zoom'}
      </div>
    </div>
  );
}
