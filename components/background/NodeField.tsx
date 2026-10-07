"use client";

import { useEffect, useRef } from "react";
import styles from "./NodeField.module.css";

const COLOR = "159, 180, 255"; // cool white-blue
const NODE_COUNT = 260;
const ARMS = 3;
const FLOW = 0.016; // rad/s — the whole galaxy drifts like a slow river
const LINK_DIST = 0.26; // normalised distance that forms a connection
const CAMERA = 2.6; // perspective focal distance
const PULSE_RADIUS = 560;
const PULSE_LIFE = 3;

type Pulse = { x: number; y: number; t0: number };

type Node = {
  r: number; // radius from the galaxy centre (0..~1.2, 1 = screen edge)
  th: number; // base angle along its arm
  z: number; // depth
  p1: number;
  p2: number;
  p3: number;
};

// Deterministic pseudo-random so the field looks the same on every load.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function gaussian(r: () => number) {
  return (r() + r() + r() - 1.5) * 1.15;
}

/** Water-ripple profile: fast start, decelerating spread, fading crests. */
function ripple(age: number) {
  // rAF timestamps can trail performance.now() slightly, so clamp from below too
  const k = Math.min(1, Math.max(0, age / PULSE_LIFE));
  const ease = 1 - Math.pow(1 - k, 3);
  return {
    ring: PULSE_RADIUS * ease,
    width: 50 + 140 * ease,
    life: Math.pow(1 - k, 2),
  };
}

function crest(dist: number, ring: number, width: number) {
  const x = Math.min(1, Math.abs(dist - ring) / width);
  const s = 1 - x * x * (3 - 2 * x);
  return s * s;
}

/**
 * A loose spiral galaxy of nodes behind the hero, spanning the screen's
 * extremities on any aspect ratio, turning slowly like a river and lit by
 * two wandering lamps so regions surface out of the dark and sink back.
 * Calmer near the centre so it never competes with the logo. On desktop a
 * click sends a water-like ripple through the nodes. Static under
 * prefers-reduced-motion.
 */
export default function NodeField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const pulses: Pulse[] = [];
    const r = rng(20261007);

    // Nodes scattered along three spiral arms, denser toward the rim.
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => {
      const rad = 0.24 + Math.pow(r(), 0.7) * 0.98;
      const arm = i % ARMS;
      return {
        r: rad,
        th: (arm / ARMS) * Math.PI * 2 + rad * 2.3 + gaussian(r) * 0.28,
        z: gaussian(r) * 0.5,
        p1: r() * Math.PI * 2,
        p2: r() * Math.PI * 2,
        p3: r() * Math.PI * 2,
      };
    });

    // Working buffers
    const wx = new Float32Array(NODE_COUNT);
    const wy = new Float32Array(NODE_COUNT);
    const wz = new Float32Array(NODE_COUNT);
    const sx = new Float32Array(NODE_COUNT);
    const sy = new Float32Array(NODE_COUNT);
    const sc = new Float32Array(NODE_COUNT);
    const br = new Float32Array(NODE_COUNT);

    // Desktop reads a little clearer and larger than a phone.
    const nodeAlpha = coarse ? 0.55 : 0.75;
    const linkAlpha = coarse ? 0.2 : 0.28;
    const nodeSize = coarse ? 1.2 : 1.7;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    const start = performance.now();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const t = reduced ? 0 : (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      // Normalised radius 1 lands on the screen edge in each axis, so the
      // galaxy always reaches the extremities — tall phones included.
      const unitX = w * 0.5;
      const unitY = h * 0.5;
      const maxD = Math.hypot(cx, cy);

      for (let i = pulses.length - 1; i >= 0; i--) {
        if (t - pulses[i].t0 > PULSE_LIFE) pulses.splice(i, 1);
      }

      // Two lamps wandering through the volume. Nodes near a lamp are lit.
      const lamps = [
        {
          x: Math.sin(t * 0.07) * 0.9,
          y: Math.cos(t * 0.05 + 1.3) * 0.8,
          z: Math.sin(t * 0.045 + 0.7) * 0.7,
        },
        {
          x: Math.cos(t * 0.06 + 2.1) * 0.9,
          y: Math.sin(t * 0.08 + 0.4) * 0.8,
          z: Math.cos(t * 0.05 + 2.6) * 0.7,
        },
      ];

      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i];
        // Slow river flow around the centre with a gentle meander and breath
        const th = n.th + t * FLOW + Math.sin(t * 0.09 + n.p1) * 0.05;
        const rad = n.r * (1 + Math.sin(t * 0.05 + n.p2) * 0.045);
        wx[i] = Math.cos(th) * rad + Math.sin(t * 0.07 + n.p3) * 0.02;
        wy[i] = Math.sin(th) * rad + Math.cos(t * 0.06 + n.p1) * 0.02;
        wz[i] = n.z + Math.sin(t * 0.12 + n.p3) * 0.08;

        const s = CAMERA / (CAMERA - wz[i]);
        sc[i] = s;
        sx[i] = cx + wx[i] * unitX * s;
        sy[i] = cy + wy[i] * unitY * s;

        // Brightness: lamp proximity × depth × distance from screen centre
        let lit = 0;
        for (const L of lamps) {
          const dx = wx[i] - L.x;
          const dy = wy[i] - L.y;
          const dz = wz[i] - L.z;
          lit += Math.exp(-(dx * dx + dy * dy + dz * dz) / 0.6);
        }
        lit = Math.min(1, lit);
        const depth = 0.4 + 0.6 * (wz[i] + 1) * 0.5;
        const d = Math.hypot(sx[i] - cx, sy[i] - cy) / maxD;
        const centre = 0.12 + 0.88 * Math.min(1, d * 1.6);
        br[i] = lit * depth * centre;
      }

      // Links between neighbours
      ctx.lineWidth = 1;
      for (let i = 0; i < NODE_COUNT; i++) {
        if (br[i] < 0.02) continue;
        for (let j = i + 1; j < NODE_COUNT; j++) {
          if (br[j] < 0.02) continue;
          const dx = wx[i] - wx[j];
          const dy = wy[i] - wy[j];
          const dz = (wz[i] - wz[j]) * 0.6;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const falloff = 1 - Math.sqrt(d2) / LINK_DIST;
          const a = Math.min(br[i], br[j]) * falloff * linkAlpha;
          if (a < 0.003) continue;
          ctx.strokeStyle = `rgba(${COLOR}, ${a})`;
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i]);
          ctx.lineTo(sx[j], sy[j]);
          ctx.stroke();
        }
      }

      // Nodes, brightened by passing ripples
      for (let i = 0; i < NODE_COUNT; i++) {
        let a = br[i] * nodeAlpha;
        let radius = 0.7 + sc[i] * nodeSize;
        for (const p of pulses) {
          const { ring, width, life } = ripple(t - p.t0);
          const dist = Math.hypot(sx[i] - p.x, sy[i] - p.y);
          const k =
            (crest(dist, ring, width) + 0.45 * crest(dist, ring * 0.7, width * 0.8)) * life;
          a += k * 0.22 * (0.3 + br[i]);
          radius += k * 1.1;
        }
        if (a < 0.004) continue;
        ctx.fillStyle = `rgba(${COLOR}, ${Math.min(0.8, a)})`;
        ctx.beginPath();
        ctx.arc(sx[i], sy[i], radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft crest lines for each ripple
      for (const p of pulses) {
        const { ring, width, life } = ripple(t - p.t0);
        ctx.lineWidth = 1 + width * 0.03;
        ctx.strokeStyle = `rgba(${COLOR}, ${0.04 * life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${COLOR}, ${0.018 * life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced) return;
      pulses.push({ x: e.clientX, y: e.clientY, t0: (performance.now() - start) / 1000 });
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onDown, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={ref} className={styles.field} aria-hidden="true" />;
}
