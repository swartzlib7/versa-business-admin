'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function NodeCluster() {
  const groupRef = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    const count = 12;
    const result: { pos: [number, number, number]; color: string; size: number }[] = [];
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 1.5;
      const y = (Math.random() - 0.5) * 3;
      result.push({
        pos: [Math.cos(theta) * radius, y, Math.sin(theta) * radius],
        color: ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#3b82f6'][i % 5],
        size: 0.15 + Math.random() * 0.25,
      });
    }
    return result;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <Sphere key={i} args={[node.size, 16, 16]} position={node.pos}>
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.2}
          />
        </Sphere>
      ))}
      {/* Connecting lines between nearby nodes */}
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => {
          const dist = Math.sqrt(
            (a.pos[0] - b.pos[0]) ** 2 +
            (a.pos[1] - b.pos[1]) ** 2 +
            (a.pos[2] - b.pos[2]) ** 2
          );
          if (dist > 3.5) return null;
          return (
            <Line
              key={`${i}-${j}`}
              points={[a.pos, b.pos]}
              color="#6366f1"
              lineWidth={0.5}
              transparent
              opacity={0.15}
            />
          );
        })
      )}
    </group>
  );
}

function CentralSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.05);
    }
  });

  return (
    <Sphere ref={meshRef} args={[0.6, 32, 32]} position={[0, 0, 0]}>
      <meshStandardMaterial
        color="#6366f1"
        emissive="#6366f1"
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.3}
      />
    </Sphere>
  );
}

export function MissionControlScene() {
  return (
    <div className="h-[400px] w-full rounded-lg border border-border bg-black/5 dark:bg-black/20 overflow-hidden">
      <Canvas
        camera={{ position: [6, 3, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#6366f1" />
        <CentralSphere />
        <NodeCluster />
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
        Agent Activity Graph — drag to orbit, scroll to zoom
      </div>
    </div>
  );
}
