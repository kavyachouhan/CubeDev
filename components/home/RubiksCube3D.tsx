"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Single face of a cubie with a colored sticker
function CubieFace({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[0.85, 0.85]} />
      <meshStandardMaterial color={color} side={THREE.FrontSide} />
    </mesh>
  );
}

// A single cubie of the Rubik's cube, which may have 1-3 visible colored faces
function Cubie({
  position,
  colors,
}: {
  position: [number, number, number];
  colors: {
    right?: string;
    left?: string;
    top?: string;
    bottom?: string;
    front?: string;
    back?: string;
  };
}) {
  const baseColor = "#1a1a2e";

  return (
    <group position={position}>
      {/* Base cube body */}
      <mesh>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <meshStandardMaterial color={baseColor} />
      </mesh>

      {/* Colored sticker faces */}
      {colors.right && (
        <CubieFace
          position={[0.48, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          color={colors.right}
        />
      )}
      {colors.left && (
        <CubieFace
          position={[-0.48, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          color={colors.left}
        />
      )}
      {colors.top && (
        <CubieFace
          position={[0, 0.48, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={colors.top}
        />
      )}
      {colors.bottom && (
        <CubieFace
          position={[0, -0.48, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          color={colors.bottom}
        />
      )}
      {colors.front && (
        <CubieFace
          position={[0, 0, 0.48]}
          rotation={[0, 0, 0]}
          color={colors.front}
        />
      )}
      {colors.back && (
        <CubieFace
          position={[0, 0, -0.48]}
          rotation={[0, Math.PI, 0]}
          color={colors.back}
        />
      )}
    </group>
  );
}

// Full 3x3 Rubik's cube built from 26 cubies
function RubiksCubeModel({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Standard Rubik's cube colors
  const COLORS = {
    white: "#ffffff",
    yellow: "#ffd500",
    red: "#b71234",
    orange: "#ff5800",
    blue: "#0046ad",
    green: "#009b48",
  };

  // Generate positions and colors for all 26 visible cubies in a 3x3 Rubik's cube
  const cubies = useMemo(() => {
    const result: {
      position: [number, number, number];
      colors: {
        right?: string;
        left?: string;
        top?: string;
        bottom?: string;
        front?: string;
        back?: string;
      };
    }[] = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip the center cubie at (0,0,0) which is not visible
          if (x === 0 && y === 0 && z === 0) continue;

          const colors: {
            right?: string;
            left?: string;
            top?: string;
            bottom?: string;
            front?: string;
            back?: string;
          } = {};

          if (x === 1) colors.right = COLORS.red;
          if (x === -1) colors.left = COLORS.orange;
          if (y === 1) colors.top = COLORS.white;
          if (y === -1) colors.bottom = COLORS.yellow;
          if (z === 1) colors.front = COLORS.blue;
          if (z === -1) colors.back = COLORS.green;

          result.push({ position: [x, y, z], colors });
        }
      }
    }

    return result;
  }, []);

  // Animate the cube: auto-rotate and tilt based on scroll
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Auto-rotation
    groupRef.current.rotation.y += delta * 0.15;
    // Tilt based on scroll progress (0 to 1)
    const targetX = -0.3 + scrollProgress * 0.6;
    groupRef.current.rotation.x +=
      (targetX - groupRef.current.rotation.x) * 0.05;
  });

  return (
    <group ref={groupRef} rotation={[-0.3, 0.5, 0]}>
      {cubies.map((cubie, i) => (
        <Cubie key={i} position={cubie.position} colors={cubie.colors} />
      ))}
    </group>
  );
}

export default function RubiksCube3D({
  scrollProgress = 0,
  className = "",
}: {
  scrollProgress?: number;
  className?: string;
}) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [4, 3, 4], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -3, 2]} intensity={0.3} />
        <RubiksCubeModel scrollProgress={scrollProgress} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}