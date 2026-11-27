"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type JSX, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { makeStudioEnvTexture } from "@/components/hero/studioEnv";
import { makeHaloTexture } from "@/components/ventures/markTexture";
import { drawProcessLoop } from "./processLoop";

/**
 * The About-section glass cube: the same glass as the venture cubes, with the
 * "how an IP gets built" loop playing inside it as a live canvas texture.
 * Hover leans the cube toward the cursor and squares a face up to you.
 */

const ENV_IDLE = 1.5;
const ENV_HOVER = 0.45;
const ENV_BACK = 0.3;
const THICKNESS = 0.2;
const QUARTER = Math.PI / 2;
const ACCENT = "#9cc0ff";
/** Texture resolution of the loop (it is 200 units square). */
const LOOP_PX = 640;
/** The frame shown when motion is reduced: the reel on the phone. */
const STILL_AT = 7.3;
const damp = THREE.MathUtils.damp;

type Quality = { mobile: boolean; reduced: boolean };
type Pointer = { on: boolean; x: number; y: number };

type Loop = { ctx: CanvasRenderingContext2D | null; texture: THREE.CanvasTexture };

/** Draw the loop at time t and flag the texture for upload. */
function paint(loop: Loop, t: number) {
  if (!loop.ctx) return;
  drawProcessLoop(loop.ctx, t, LOOP_PX);
  loop.texture.needsUpdate = true;
}

/** The loop drawn into an offscreen canvas, re-uploaded every frame. */
function useLoopTexture(reduced: boolean) {
  const loop = useMemo((): Loop => {
    const canvas = document.createElement("canvas");
    canvas.width = LOOP_PX;
    canvas.height = LOOP_PX;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { ctx, texture };
  }, []);

  useEffect(() => {
    // Draw once straight away (and again when the brand font lands) so a
    // paused canvas still shows something.
    const draw = () => paint(loop, STILL_AT);
    draw();
    document.fonts.ready.then(draw);
    return () => loop.texture.dispose();
  }, [loop]);

  useFrame((state) => {
    if (!reduced) paint(loop, state.clock.elapsedTime);
  });

  return loop.texture;
}

function Cube({
  pointer,
  onHover,
  onLeave,
  quality,
  halo,
  env,
}: {
  pointer: RefObject<Pointer>;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  quality: Quality;
  halo: THREE.Texture;
  env: THREE.Texture;
}) {
  const { mobile, reduced } = quality;
  const loop = useLoopTexture(reduced);
  const viewport = useThree((s) => s.viewport);
  // The canvas bleeds 22% past the cube's box on every side.
  const size = Math.min(viewport.width, viewport.height) * 0.39;
  const accent = useMemo(() => new THREE.Color(ACCENT), []);

  const float = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glass = useRef<any>(null);
  const loopMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowMat = useRef<THREE.SpriteMaterial>(null);
  const haloMat = useRef<THREE.SpriteMaterial>(null);
  const rim = useRef<THREE.PointLight>(null);

  const s = useRef({
    yaw: reduced ? 0.5 : 0.6,
    pitch: 0.3,
    speed: 0,
    snap: 0,
    wasHover: false,
    hover: 0,
    tiltX: 0,
    tiltY: 0,
    intro: 0,
  });

  useFrame((state, delta) => {
    const st = s.current;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const p = pointer.current;

    st.hover = damp(st.hover, p.on ? 1 : 0, 5, dt);
    st.intro = damp(st.intro, 1, 2.2, dt);
    st.tiltX = damp(st.tiltX, p.on ? p.x : 0, 6, dt);
    st.tiltY = damp(st.tiltY, p.on ? p.y : 0, 6, dt);

    if (p.on && !st.wasHover) st.snap = Math.round(st.yaw / QUARTER) * QUARTER;
    st.wasHover = p.on;
    if (p.on) {
      st.speed = 0;
      st.yaw = damp(st.yaw, st.snap + st.tiltX * 0.3, 5, dt);
      st.pitch = damp(st.pitch, -st.tiltY * 0.26, 5, dt);
    } else {
      st.speed = damp(st.speed, reduced ? 0 : 0.14, 1.6, dt);
      st.yaw += st.speed * dt;
      st.pitch = damp(st.pitch, reduced ? 0.28 : 0.3 + Math.sin(t * 0.4) * 0.1, 2.5, dt);
    }
    body.current?.rotation.set(st.pitch, st.yaw, reduced ? 0 : Math.sin(t * 0.31) * 0.05 * (1 - st.hover));

    const f = float.current;
    if (f) {
      const bob = reduced ? 0 : Math.sin(t * 0.7) * 0.06 * size;
      f.position.set(0, bob - (1 - st.intro) * 0.5, st.hover * 0.5);
      f.scale.setScalar(size * (0.86 + 0.14 * st.intro));
    }

    // The loop mostly faces you, swaying a little against the spin.
    const l = inner.current;
    if (l) {
      const sway = -Math.sin(st.yaw * 2) * 0.16 * (1 - st.hover);
      l.rotation.set(st.pitch * 0.3 * (1 - st.hover) - st.tiltY * 0.14, sway + st.tiltX * 0.16, 0);
      l.position.z = st.hover * 0.06;
      l.scale.setScalar(1 + st.hover * 0.06);
    }

    const g = glass.current;
    if (g) {
      g.envMapIntensity = ENV_IDLE - st.hover * (ENV_IDLE - ENV_HOVER);
      g.envMapRotation.copy(state.scene.environmentRotation);
      // Clearer than the venture cubes: the loop has fine detail to read.
      g.attenuationDistance = size * (9 + st.hover * 6);
      g.emissiveIntensity = st.hover * 0.03;
      g.chromaticAberration = 0.07 + st.hover * 0.03;
      g.thickness = THICKNESS * (1 - st.hover * 0.7);
    }
    if (loopMat.current) loopMat.current.opacity = st.intro * (0.94 + st.hover * 0.06);
    if (glowMat.current) glowMat.current.opacity = st.intro * (0.14 + st.hover * 0.2);
    if (haloMat.current) haloMat.current.opacity = st.hover * 0.28;
    if (rim.current) rim.current.intensity = st.hover * 9 * size;
  });

  const track = (e: ThreeEvent<PointerEvent>) => {
    const f = float.current;
    if (!f) return;
    const half = size * 0.6;
    onHover(
      THREE.MathUtils.clamp((e.point.x - f.position.x) / half, -1, 1),
      THREE.MathUtils.clamp((e.point.y - f.position.y) / half, -1, 1),
    );
  };

  return (
    <group ref={float} scale={size}>
      {/* Hit target that doesn't spin, so hover stays stable. */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          track(e);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          track(e);
        }}
        onPointerOut={onLeave}
      >
        <boxGeometry args={[1.3, 1.3, 0.3]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      <sprite position={[0, 0, -0.75]} scale={2.5}>
        <spriteMaterial
          ref={haloMat}
          map={halo}
          color={accent}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>

      <pointLight ref={rim} color={accent} intensity={0} distance={size * 5} decay={2} position={[0.35, 1.3, 2.2]} />

      {/* The loop. Like the venture marks it only reaches the screen through
          the glass's transmission buffer, so it is genuinely refracted. */}
      <group ref={inner}>
        <sprite position={[0, 0, -0.03]} scale={1.15} renderOrder={1}>
          <spriteMaterial
            ref={glowMat}
            map={halo}
            color={accent}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
        <mesh scale={0.84} renderOrder={2}>
          <planeGeometry />
          <meshBasicMaterial
            ref={loopMat}
            map={loop}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={body}>
        <RoundedBox args={[1, 1, 1]} radius={0.085} smoothness={mobile ? 4 : 6} creaseAngle={0.4}>
          <MeshTransmissionMaterial
            ref={glass}
            transmission={1}
            thickness={THICKNESS}
            backside={!mobile}
            backsideThickness={0.1}
            ior={1.45}
            roughness={0.015}
            chromaticAberration={0.07}
            iridescence={0.12}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[300, 720]}
            anisotropicBlur={0}
            distortion={0}
            color="#c9d2ea"
            attenuationColor="#070b18"
            attenuationDistance={size * 9}
            emissive={accent}
            emissiveIntensity={0}
            specularIntensity={1}
            specularColor="#4a5068"
            clearcoat={0.15}
            clearcoatRoughness={0.03}
            envMap={env}
            envMapIntensity={ENV_IDLE}
            backsideEnvMapIntensity={ENV_BACK}
            samples={mobile ? 3 : 6}
            resolution={mobile ? 512 : undefined}
            backsideResolution={mobile ? 256 : 512}
          />
        </RoundedBox>
      </group>
    </group>
  );
}

function Studio({ reduced, map }: { reduced: boolean; map: THREE.Texture }) {
  useFrame(({ scene, clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    scene.environmentRotation.set(Math.sin(t * 0.031) * 0.35, t * 0.045 + 1.4, Math.sin(t * 0.019 + 1.2) * 0.2);
  });
  return (
    <>
      <Environment map={map} />
      <directionalLight position={[8, 7, 6]} intensity={2} color="#ffffff" />
      <directionalLight position={[-9, -3, 4]} intensity={1} color="#8fb6ff" />
    </>
  );
}

function Scene({ quality }: { quality: Quality }) {
  const pointer = useRef<Pointer>({ on: false, x: 0, y: 0 });
  const [halo] = useState(makeHaloTexture);
  const [env] = useState(makeStudioEnvTexture);
  const gl = useThree((s) => s.gl);

  useEffect(() => () => halo.dispose(), [halo]);
  useEffect(() => () => env.dispose(), [env]);

  useEffect(() => {
    const el = gl.domElement;
    const clear = () => (pointer.current.on = false);
    el.addEventListener("pointerleave", clear);
    window.addEventListener("blur", clear);
    return () => {
      el.removeEventListener("pointerleave", clear);
      window.removeEventListener("blur", clear);
    };
  }, [gl]);

  return (
    <>
      <Studio reduced={quality.reduced} map={env} />
      <Cube
        pointer={pointer}
        onHover={(x, y) => Object.assign(pointer.current, { on: true, x, y })}
        onLeave={() => (pointer.current.on = false)}
        quality={quality}
        halo={halo}
        env={env}
      />
    </>
  );
}

export default function ProcessCube({
  className,
  running = true,
}: {
  className?: string;
  /** Pause rendering (e.g. while another section is in front). */
  running?: boolean;
}): JSX.Element {
  const wrap = useRef<HTMLDivElement>(null);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [onscreen, setOnscreen] = useState(true);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setQuality({ mobile: coarse.matches, reduced: motion.matches });
    read();
    motion.addEventListener("change", read);
    return () => motion.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const live = onscreen && running;

  return (
    <div ref={wrap} className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      {quality && (
        <Canvas
          aria-hidden="true"
          dpr={[1, quality.mobile ? 1.5 : 2]}
          resize={{ offsetSize: true }}
          frameloop={live ? "always" : "demand"}
          camera={{ position: [0, 0, 12], fov: 32, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0, background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Scene quality={quality} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
