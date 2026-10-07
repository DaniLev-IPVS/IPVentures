"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import logo from "./ip-logo.json";
import { useFootageTexture } from "./useFootageTexture";
import { usePointerRig } from "./usePointerRig";
import { makeStudioEnvTexture } from "./studioEnv";

/**
 * Showreel clip refracted inside the glass. Set to a short, compressed, muted
 * loop in /public/videos (e.g. "/videos/showreel-loop.mp4"). While null, a
 * painted sky plate is used instead.
 */
const FOOTAGE_SRC: string | null = null;

// Transforms lifted from the Spline scene: both meshes rotate (90,0,0);
// inner "Curve011" scales 30/27/30, outer "Curve013" 30.07/27.98/30.27.
const INNER_SCALE: [number, number, number] = [1, 27 / 30, 1];
const OUTER_SCALE: [number, number, number] = [30.07 / 30, 27.98 / 30, 30.27 / 30];
// Local x extent — screen width (z becomes screen height after the 90° tilt).
const LOGO_W = 7.72;

function buildGeometry(
  positions: number[],
  indices: number[],
  center: THREE.Vector3,
  bounds: THREE.Box3,
) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  // Planar UVs across the whole logo so footage reads as one image, not per face.
  const w = bounds.max.x - bounds.min.x;
  const d = bounds.max.z - bounds.min.z;
  const uv = new Float32Array((positions.length / 3) * 2);
  for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
    uv[j] = (positions[i] - bounds.min.x) / w;
    // Local +z becomes screen-down after the 90° tilt, so flip v.
    uv[j + 1] = (bounds.max.z - positions[i + 2]) / d;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.translate(-center.x, -center.y, -center.z);
  // Vertices are duplicated along hard edges, so averaged normals keep bevels crisp.
  g.computeVertexNormals();
  return g;
}

function useLogoGeometries() {
  return useMemo(() => {
    const bounds = new THREE.Box3();
    const p = new THREE.Vector3();
    for (let i = 0; i < logo.outer.length; i += 3) {
      bounds.expandByPoint(p.set(logo.outer[i], logo.outer[i + 1], logo.outer[i + 2]));
    }
    const center = bounds.getCenter(new THREE.Vector3());
    return {
      outer: buildGeometry(logo.outer, logo.indices, center, bounds),
      inner: buildGeometry(logo.inner, logo.indices, center, bounds),
    };
  }, []);
}

type Debug = "core" | "shell" | "plain" | null;

function Logo({ mobile, debug }: { mobile: boolean; debug: Debug }) {
  const geo = useLogoGeometries();
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const footage = useFootageTexture(mobile ? null : FOOTAGE_SRC);
  usePointerRig(group);

  // Fit the logo's width to a share of the full viewport: ~53vw / 58vh on
  // desktop, ~75vw / 82vh on phones (the canvas itself covers the screen).
  const fitW = viewport.width * (mobile ? 0.75 : 0.53);
  const fitH = viewport.height * (mobile ? 0.82 : 0.58);
  const scale = Math.min(fitW, fitH) / LOGO_W;

  return (
    <group ref={group} scale={scale}>
      {/* Inner core carries footage when a clip is set; hidden otherwise so
          the obsidian shell stays see-through. */}
      <mesh
        geometry={geo.inner}
        rotation-x={Math.PI / 2}
        scale={INNER_SCALE}
        visible={debug === "core" || (debug !== "shell" && !!FOOTAGE_SRC)}
      >
        {/* Footage is emissive (unlit) like Spline's video layer, so it glows
            through the glass instead of reading as a lit plastic surface. */}
        <meshPhysicalMaterial
          color="#050a1f"
          emissive="#ffffff"
          emissiveMap={footage}
          emissiveIntensity={0.8}
          metalness={0}
          roughness={0.5}
          iridescence={0.6}
          iridescenceIOR={1.4}
          iridescenceThicknessRange={[100, 420]}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Outer shell: smoky obsidian glass. Transparent faces fall into the
          black background; grazing faces catch the studio panels. */}
      <mesh
        geometry={geo.outer}
        rotation-x={Math.PI / 2}
        scale={OUTER_SCALE}
        visible={debug !== "core"}
      >
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.2}
          backside
          backsideThickness={0.4}
          ior={1.5}
          roughness={0.04}
          chromaticAberration={0.14}
          iridescence={0.25}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[300, 720]}
          anisotropicBlur={0.1}
          distortion={0.08}
          distortionScale={0.4}
          temporalDistortion={0.04}
          color="#c9d2ea"
          attenuationColor="#070b18"
          attenuationDistance={0.7}
          specularIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={5}
          samples={mobile ? 4 : 8}
          resolution={mobile ? 512 : 1024}
        />
      </mesh>
    </group>
  );
}

/** Painted studio environment — no HDR download needed. */
function Studio() {
  const [map] = useState(makeStudioEnvTexture);
  return <Environment map={map} />;
}

/** Dev-only: dumps scene facts to <body data-probe> for inspection. */
function DebugProbe() {
  const frames = useRef(0);
  useFrame(({ scene, gl }) => {
    if (frames.current++ !== 40) return;
    const meshes: Record<string, unknown>[] = [];
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined;
      if ((o as THREE.Mesh).isMesh && m) {
        meshes.push({
          type: m.type,
          visible: o.visible,
          envInt: m.envMapIntensity,
          emissiveMap: !!m.emissiveMap,
          transmission: m.transmission,
        });
      }
    });
    const env = scene.environment;
    const img = env?.image as { width?: number } | undefined;
    document.body.dataset.probe = JSON.stringify({
      env: env ? { mapping: env.mapping, w: img?.width ?? null } : null,
      toneMapping: gl.toneMapping,
      meshes,
      children: scene.children.length,
    });
  });
  return null;
}

export default function LogoScene() {
  // Client-only component (loaded with ssr: false), so window is safe here.
  const [mobile] = useState(
    () => window.matchMedia("(pointer: coarse)").matches,
  );
  const [debug] = useState<Debug>(() => {
    const d = new URLSearchParams(window.location.search).get("debug");
    return d === "core" || d === "shell" || d === "plain" ? d : null;
  });

  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 2]}
      camera={{ position: [0, 0, 12], fov: 32, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      {debug && <DebugProbe />}
      {debug === "plain" ? (
        <mesh rotation={[0.5, 0.6, 0]}>
          <boxGeometry args={[3, 3, 3]} />
          <meshNormalMaterial />
        </mesh>
      ) : (
        <Suspense fallback={null}>
          <Studio />
          <Logo mobile={mobile} debug={debug} />
        </Suspense>
      )}
      <directionalLight position={[8, 7, 6]} intensity={2} color="#ffffff" />
      <directionalLight position={[-9, -3, 4]} intensity={1} color="#8fb6ff" />
    </Canvas>
  );
}
