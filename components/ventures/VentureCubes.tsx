"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { ventures, type Venture } from "@/lib/content";
import { makeStudioEnvTexture } from "@/components/hero/studioEnv";
import { FILL, loadLockupTextures, makeHaloTexture, type Lockup, type MarkTextures } from "./markTexture";
import { brandFonts } from "./fonts";

/**
 * What floats inside each cube: the venture's mark with its wordmark stacked
 * underneath. Wordmarks that ship as live <text> are set here in their real
 * brand fonts (loaded by next/font) instead of rasterizing the SVG.
 */
const LOCKUPS: Record<Venture["id"], Lockup> = {
  influity: {
    mark: { kind: "svg", url: "/ventures/influity-mark-white.svg" },
    wordmark: { kind: "svg", url: "/ventures/influity-wordmark-white.svg" },
    wordmarkWidth: 1.55,
    wordmarkMaxHeight: 0.4,
    gap: 0.24,
  },
  ipanimations: {
    mark: { kind: "svg", url: "/ventures/ipanimations-mark-paper.svg" },
    // "IP animations" with the brand's letter wave (from the official lockup).
    wordmark: {
      kind: "text",
      text: "IPanimations",
      font: brandFonts.grandstander,
      weight: 800,
      color: "#FFF6EA",
      gaps: { 1: 0.23 },
      offsets: [0, 0, 0, -0.125, -0.198, -0.125, 0, 0.125, 0.198, 0.125, 0, -0.125],
    },
    wordmarkWidth: 1.25,
    wordmarkMaxHeight: 0.42,
    gap: 0.22,
  },
  ipstudios: {
    mark: { kind: "text", text: "IP", font: brandFonts.dmSerif, weight: 400, color: "#ff2d5e", tracking: -0.04 },
    wordmark: { kind: "text", text: "STUDIOS", font: brandFonts.archivo, weight: 600, color: "#f4e8dd", tracking: 0.32 },
    wordmarkWidth: 1.25,
    wordmarkMaxHeight: 0.3,
    gap: 0.18,
  },
};

// Reflection strength of the studio on the glass: spinning, facing you, and
// on the inner faces seen through the cube.
const ENV_IDLE = 1.5;
const ENV_HOVER = 0.45;
const ENV_BACK = 0.3;
const THICKNESS = 0.2;

/** Below this canvas width the row becomes a column. */
const STACK_BELOW = 760;
const QUARTER = Math.PI / 2;
const damp = THREE.MathUtils.damp;

type Quality = { mobile: boolean; reduced: boolean };

/** Which cube the pointer is on, and where inside it (-1..1). Lives in a ref
 *  so pointer moves never re-render React. */
type Pointer = { id: string | null; x: number; y: number };

type Slot = { x: number; y: number; z: number; size: number };

function useLayout(count: number): Slot[] {
  const viewport = useThree((s) => s.viewport);
  const width = useThree((s) => s.size.width);
  return useMemo(() => {
    const stacked = width < STACK_BELOW;
    const mid = (count - 1) / 2;
    // A little depth stagger so the row doesn't sit on one plane.
    const depth = [-0.35, 0.3, -0.15];
    if (stacked) {
      const size = Math.min(viewport.width * 0.38, viewport.height * 0.165);
      return Array.from({ length: count }, (_, i) => ({
        x: (i % 2 === 0 ? -1 : 1) * size * 0.12,
        y: (mid - i) * size * 1.8,
        z: depth[i % depth.length] * 0.6,
        size,
      }));
    }
    const size = Math.min(viewport.width * 0.165, viewport.height * 0.36);
    return Array.from({ length: count }, (_, i) => ({
      x: (i - mid) * size * 1.78,
      y: (i % 2 === 0 ? 1 : -1) * size * 0.05,
      z: depth[i % depth.length],
      size,
    }));
  }, [viewport.width, viewport.height, width, count]);
}

function useMark(venture: Venture): MarkTextures | null {
  const [tex, setTex] = useState<MarkTextures | null>(null);
  useEffect(() => {
    let alive = true;
    let loaded: MarkTextures | null = null;
    loadLockupTextures(LOCKUPS[venture.id], venture.accent)
      .then((t) => {
        loaded = t;
        if (alive) setTex(t);
        else {
          t.mark.dispose();
          t.glow.dispose();
        }
      })
      .catch((err) => console.warn("[VentureCubes]", err));
    return () => {
      alive = false;
      loaded?.mark.dispose();
      loaded?.glow.dispose();
    };
  }, [venture.id, venture.accent]);
  return tex;
}

function Cube({
  venture,
  index,
  slot,
  pointer,
  onHover,
  onLeave,
  quality,
  halo,
  env,
  onOpen,
}: {
  venture: Venture;
  index: number;
  slot: Slot;
  pointer: RefObject<Pointer>;
  /** Report the pointer entering/moving on this cube (x,y in -1..1), or leaving. */
  onHover: (id: string, x: number, y: number) => void;
  onLeave: (id: string) => void;
  quality: Quality;
  halo: THREE.Texture;
  /** The studio map, bound to the glass itself (see the note on the material). */
  env: THREE.Texture;
  onOpen: (v: Venture) => void;
}) {
  const { mobile, reduced } = quality;
  const tex = useMark(venture);
  const accent = useMemo(() => new THREE.Color(venture.accent), [venture.accent]);

  const float = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const logo = useRef<THREE.Group>(null);
  // drei's material type isn't exported in a ref-friendly form.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glass = useRef<any>(null);
  const markMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const haloMat = useRef<THREE.SpriteMaterial>(null);
  const rim = useRef<THREE.PointLight>(null);

  const phase = index * 2.1 + 0.6;
  const s = useRef({
    yaw: reduced ? [0.5, -0.42, 0.46][index % 3] : phase * 0.9,
    pitch: 0.3,
    speed: 0,
    snap: 0,
    wasHover: false,
    hover: 0, // 0..1 eased
    dim: 0, // 0..1 eased, another cube is hovered
    tiltX: 0,
    tiltY: 0,
    intro: 0,
  });

  useFrame((state, delta) => {
    const st = s.current;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const p = pointer.current;
    const isHover = p.id === venture.id;
    const otherHover = p.id !== null && !isHover;

    st.hover = damp(st.hover, isHover ? 1 : 0, 5, dt);
    st.dim = damp(st.dim, otherHover ? 1 : 0, 4, dt);
    st.intro = damp(st.intro, 1, 2.2, dt);
    st.tiltX = damp(st.tiltX, isHover ? p.x : 0, 6, dt);
    st.tiltY = damp(st.tiltY, isHover ? p.y : 0, 6, dt);

    // --- rotation -----------------------------------------------------------
    if (isHover && !st.wasHover) {
      // A cube looks the same every quarter turn: settle on the nearest face.
      st.snap = Math.round(st.yaw / QUARTER) * QUARTER;
    }
    st.wasHover = isHover;
    if (isHover) {
      st.speed = 0;
      // Aim the face at the camera itself (side cubes sit off-axis), then lean
      // toward the cursor. Kept modest so the lockup stays inside one face.
      const dist = state.camera.position.z - slot.z;
      const aimYaw = -Math.atan2(slot.x, dist);
      const aimPitch = Math.atan2(slot.y, dist);
      st.yaw = damp(st.yaw, st.snap + aimYaw + st.tiltX * 0.3, 5, dt);
      st.pitch = damp(st.pitch, aimPitch - st.tiltY * 0.26, 5, dt);
    } else {
      const cruise = reduced ? 0 : 0.15 + (index % 2) * 0.04;
      st.speed = damp(st.speed, cruise, 1.6, dt);
      st.yaw += st.speed * dt;
      const idlePitch = reduced ? 0.28 : 0.3 + Math.sin(t * 0.4 + phase) * 0.1;
      st.pitch = damp(st.pitch, idlePitch, 2.5, dt);
    }
    const b = body.current;
    if (b) {
      b.rotation.set(
        st.pitch,
        st.yaw,
        reduced ? 0 : Math.sin(t * 0.31 + phase * 1.7) * 0.05 * (1 - st.hover),
      );
    }

    // --- position -----------------------------------------------------------
    const f = float.current;
    if (f) {
      const bob = reduced ? 0 : Math.sin(t * 0.7 + phase) * 0.09 * slot.size;
      const sway = reduced ? 0 : Math.cos(t * 0.45 + phase * 1.3) * 0.03 * slot.size;
      f.position.set(
        slot.x + sway,
        slot.y + bob - (1 - st.intro) * 0.6,
        slot.z + st.hover * 0.6 - st.dim * 0.25,
      );
      const sc = slot.size * (0.86 + 0.14 * st.intro);
      f.scale.setScalar(sc);
    }

    // --- logo: mostly faces the viewer, with a slow sway against the spin ---
    const l = logo.current;
    if (l) {
      const sway = -Math.sin(st.yaw * 2) * 0.16 * (1 - st.hover);
      l.rotation.set(
        st.pitch * 0.3 * (1 - st.hover) - st.tiltY * 0.14,
        sway + st.tiltX * 0.16,
        0,
      );
      l.position.z = st.hover * 0.06;
      l.scale.setScalar(1 + st.hover * 0.06);
    }

    // --- materials ----------------------------------------------------------
    const g = glass.current;
    if (g) {
      // Squared up to the camera on hover, the flat front face would mirror a
      // whole studio panel and wash over the wordmark, so reflections ease off.
      g.envMapIntensity = ENV_IDLE - st.hover * (ENV_IDLE - ENV_HOVER) - st.dim * 0.3;
      g.envMapRotation.copy(state.scene.environmentRotation);
      // World units, so it scales with the cube: smoky at rest, clearer on hover.
      g.attenuationDistance = slot.size * (5 + st.hover * 6 - st.dim * 2.5);
      g.emissiveIntensity = st.hover * 0.03;
      g.chromaticAberration = 0.07 + st.hover * 0.03;
      // Thinner glass on hover = less refraction offset, so the lockup doesn't
      // split across faces while you read it. (drei resets this after its own
      // buffer passes; this value is the one the visible pass uses.)
      g.thickness = THICKNESS * (1 - st.hover * 0.7);
    }
    if (markMat.current) {
      markMat.current.opacity = st.intro * (0.92 + st.hover * 0.08 - st.dim * 0.45);
    }
    if (glowMat.current) {
      glowMat.current.opacity = st.intro * (0.16 + st.hover * 0.32 - st.dim * 0.1);
    }
    if (haloMat.current) {
      haloMat.current.opacity = st.hover * 0.3;
    }
    if (rim.current) {
      rim.current.intensity = st.hover * 9 * slot.size;
    }
  });

  const track = (e: ThreeEvent<PointerEvent>) => {
    const f = float.current;
    if (!f) return;
    const half = slot.size * 0.6;
    onHover(
      venture.id,
      THREE.MathUtils.clamp((e.point.x - f.position.x) / half, -1, 1),
      THREE.MathUtils.clamp((e.point.y - f.position.y) / half, -1, 1),
    );
  };

  return (
    <group ref={float} position={[slot.x, slot.y, slot.z]} scale={slot.size}>
      {/* Hit target: a camera-facing slab that doesn't spin, so hover is stable. */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          track(e);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          track(e);
        }}
        onPointerOut={() => onLeave(venture.id)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 8) return; // a drag/scroll, not a tap
          onOpen(venture);
        }}
      >
        <boxGeometry args={[1.3, 1.3, 0.3]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      {/* Accent bloom behind the cube; also seen refracted through the glass. */}
      <sprite position={[0, 0, -0.75]} scale={3.1}>
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

      {/* Accent glint that rakes the bevels on hover. */}
      <pointLight
        ref={rim}
        color={accent}
        intensity={0}
        distance={slot.size * 5}
        decay={2}
        position={[0.35, 1.3, 2.2]}
      />

      {/* The mark. Unlit and un-tonemapped so it keeps its brand colour; it is
          occluded by the glass in the main pass and only reaches the screen
          through the transmission buffer, i.e. genuinely refracted. */}
      <group ref={logo}>
        {tex && (
          <>
            <mesh position={[0, 0, -0.02]} scale={0.55 * 1.9} renderOrder={1}>
              <planeGeometry />
              <meshBasicMaterial
                ref={glowMat}
                map={tex.glow}
                transparent
                opacity={0}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
            <mesh scale={0.66 / FILL} renderOrder={2}>
              <planeGeometry />
              <meshBasicMaterial
                ref={markMat}
                map={tex.mark}
                transparent
                opacity={0}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </>
        )}
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
            attenuationDistance={slot.size * 5}
            emissive={accent}
            emissiveIntensity={0}
            // Dark specular colour lowers head-on reflectance only: flat faces stay
            // see-through while grazing bevels keep their bright rims.
            specularIntensity={1}
            specularColor="#4a5068"
            clearcoat={0.15}
            clearcoatRoughness={0.03}
            // three ignores envMapIntensity for scene.environment (it uses
            // scene.environmentIntensity), so the map is bound here to make the
            // per-cube intensity real.
            envMap={env}
            envMapIntensity={ENV_IDLE}
            // The inner back face sits right behind the lockup; keep it quiet.
            backsideEnvMapIntensity={ENV_BACK}
            samples={mobile ? 3 : 6}
            // Full-resolution buffer on desktop keeps the refracted mark crisp.
            resolution={mobile ? 512 : undefined}
            backsideResolution={mobile ? 256 : 512}
          />
        </RoundedBox>
      </group>
    </group>
  );
}

/** Same painted studio as the hero, slowly precessing so reflections never settle. */
function Studio({ reduced, map }: { reduced: boolean; map: THREE.Texture }) {
  useFrame(({ scene, clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    scene.environmentRotation.set(
      Math.sin(t * 0.031) * 0.35,
      t * 0.045,
      Math.sin(t * 0.019 + 1.2) * 0.2,
    );
  });
  return (
    <>
      <Environment map={map} />
      <directionalLight position={[8, 7, 6]} intensity={2} color="#ffffff" />
      <directionalLight position={[-9, -3, 4]} intensity={1} color="#8fb6ff" />
    </>
  );
}

function Scene({
  quality,
  onOpen,
}: {
  quality: Quality;
  onOpen: (v: Venture) => void;
}) {
  const items = ventures.items;
  const slots = useLayout(items.length);
  const pointer = useRef<Pointer>({ id: null, x: 0, y: 0 });
  const [halo] = useState(makeHaloTexture);
  const [env] = useState(makeStudioEnvTexture);
  const gl = useThree((s) => s.gl);

  useEffect(() => () => halo.dispose(), [halo]);
  useEffect(() => () => env.dispose(), [env]);

  const handlers = useMemo(() => {
    const el = gl.domElement;
    return {
      hover(id: string, x: number, y: number) {
        const p = pointer.current;
        p.id = id;
        p.x = x;
        p.y = y;
        el.style.setProperty("cursor", "pointer");
      },
      leave(id: string) {
        if (pointer.current.id !== id) return;
        pointer.current.id = null;
        el.style.removeProperty("cursor");
      },
    };
  }, [gl]);

  // Leaving the canvas (or the window) always releases the hover.
  useEffect(() => {
    const el = gl.domElement;
    const clear = () => {
      pointer.current.id = null;
      el.style.removeProperty("cursor");
    };
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
      {items.map((v, i) => (
        <Cube
          key={v.id}
          venture={v}
          index={i}
          slot={slots[i]}
          pointer={pointer}
          onHover={handlers.hover}
          onLeave={handlers.leave}
          quality={quality}
          halo={halo}
          env={env}
          onOpen={onOpen}
        />
      ))}
    </>
  );
}

const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function VentureCubes({
  className,
  onOpen,
}: {
  className?: string;
  onOpen?: (id: string) => void;
}): JSX.Element {
  const wrap = useRef<HTMLDivElement>(null);
  // Decided after mount so the component is safe to server-render.
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

  // Stop rendering entirely while scrolled out of view.
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnscreen(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const open = (v: Venture) => {
    if (onOpen) onOpen(v.id);
    else window.open(v.url, "_blank", "noopener");
  };

  return (
    <div
      ref={wrap}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {quality && (
        <Canvas
          aria-hidden="true"
          dpr={[1, quality.mobile ? 1.5 : 2]}
          // Measure layout size, not the on-screen box: inside the Z-scroll the
          // section is perspective-shrunk while it waits down the track.
          resize={{ offsetSize: true }}
          frameloop={onscreen ? "always" : "never"}
          camera={{ position: [0, 0, 12], fov: 32, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0, background: "transparent" }}
        >
          <Suspense fallback={null}>
            <Scene quality={quality} onOpen={open} />
          </Suspense>
        </Canvas>
      )}

      {/* Real links for keyboards and screen readers; the canvas is decorative. */}
      <ul style={srOnly}>
        {ventures.items.map((v) => (
          <li key={v.id}>
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!onOpen) return;
                e.preventDefault();
                onOpen(v.id);
              }}
            >
              {v.name} — {v.domain}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
