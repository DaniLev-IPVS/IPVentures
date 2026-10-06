"use client";

import { useEffect, useRef } from "react";
import styles from "./NodeGrid.module.css";

const SPACING = 56;
const COLOR = "159, 180, 255"; // cool white-blue
const PULSE_SPEED = 420; // px per second
const PULSE_LIFE = 1.8; // seconds

type Pulse = { x: number; y: number; t0: number };

/**
 * A barely-there drifting node grid behind the hero, calmer near the centre
 * so it never competes with the logo. On desktop a click sends a faint ripple
 * out from the pointer. Static under prefers-reduced-motion.
 */
export default function NodeGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pulses: Pulse[] = [];
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
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxD = Math.hypot(cx, cy);
      const cols = Math.ceil(w / SPACING) + 2;
      const rows = Math.ceil(h / SPACING) + 2;
      const ox = (w % SPACING) / 2 - SPACING;
      const oy = (h % SPACING) / 2 - SPACING;

      // Drop expired pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        if (t - pulses[i].t0 > PULSE_LIFE) pulses.splice(i, 1);
      }

      // Node positions with a slow drift
      const px: number[] = [];
      const py: number[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gx = ox + c * SPACING;
          const gy = oy + r * SPACING;
          const dx = reduced ? 0 : Math.sin(gy * 0.012 + t * 0.45) * 3.5;
          const dy = reduced ? 0 : Math.cos(gx * 0.011 + t * 0.38) * 3.5;
          px.push(gx + dx);
          py.push(gy + dy);
        }
      }

      // Faint connecting lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${COLOR}, 0.028)`;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (c < cols - 1) {
            ctx.moveTo(px[i], py[i]);
            ctx.lineTo(px[i + 1], py[i + 1]);
          }
          if (r < rows - 1) {
            ctx.moveTo(px[i], py[i]);
            ctx.lineTo(px[i + cols], py[i + cols]);
          }
        }
      }
      ctx.stroke();

      // Nodes, dimmer toward the centre, brightened by passing pulses
      for (let i = 0; i < px.length; i++) {
        const x = px[i];
        const y = py[i];
        const d = Math.hypot(x - cx, y - cy) / maxD;
        const falloff = 0.3 + 0.7 * Math.min(1, d * 1.15);
        let a = 0.085 * falloff;
        let radius = 1.1;
        for (const p of pulses) {
          const age = t - p.t0;
          const ring = age * PULSE_SPEED;
          const dist = Math.hypot(x - p.x, y - p.y);
          const band = 1 - Math.min(1, Math.abs(dist - ring) / 80);
          const life = 1 - age / PULSE_LIFE;
          const k = band * band * life;
          a += k * 0.22;
          radius += k * 1.2;
        }
        ctx.fillStyle = `rgba(${COLOR}, ${a})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft ring for each pulse
      for (const p of pulses) {
        const age = t - p.t0;
        const ring = age * PULSE_SPEED;
        const life = 1 - age / PULSE_LIFE;
        ctx.strokeStyle = `rgba(${COLOR}, ${0.05 * life})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring, 0, Math.PI * 2);
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

  return <canvas ref={ref} className={styles.grid} aria-hidden="true" />;
}
