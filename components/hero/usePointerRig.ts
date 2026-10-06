"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const TWO_PI = Math.PI * 2;

/**
 * Desktop: the logo tilts toward the mouse with damped easing.
 * Touch: swipe to spin with inertia, then it settles back home.
 * A slow idle drift keeps it alive when nothing is happening.
 */
export function usePointerRig(target: RefObject<THREE.Group | null>) {
  const stateRef = useRef({
    tx: 0, // normalized mouse x (-1..1)
    ty: 0,
    rx: 0, // current rotation
    ry: 0,
    vx: 0, // swipe velocity
    vy: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    reduced: false,
  });

  useEffect(() => {
    const s = stateRef.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        s.tx = (e.clientX / window.innerWidth) * 2 - 1;
        s.ty = (e.clientY / window.innerHeight) * 2 - 1;
      } else if (s.dragging) {
        const k = 0.0065;
        s.vy = (e.clientX - s.lastX) * k;
        s.vx = (e.clientY - s.lastY) * k;
        s.ry += s.vy;
        s.rx += s.vx;
        s.lastX = e.clientX;
        s.lastY = e.clientY;
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      s.dragging = true;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.vx = s.vy = 0;
    };
    const onUp = () => {
      s.dragging = false;
    };
    const onLeave = () => {
      s.tx = 0;
      s.ty = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  useFrame((state, delta) => {
    const g = target.current;
    if (!g) return;
    const s = stateRef.current;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    const idleY = s.reduced ? 0 : Math.sin(t * 0.35) * 0.1;
    const idleX = s.reduced ? 0 : Math.cos(t * 0.27) * 0.06;

    if (!s.dragging) {
      if (Math.abs(s.vx) + Math.abs(s.vy) > 0.0004) {
        // Coast on swipe inertia.
        s.ry += s.vy;
        s.rx += s.vx;
        const decay = Math.pow(0.05, dt);
        s.vx *= decay;
        s.vy *= decay;
      } else {
        // Ease toward the mouse-driven pose (home pose on touch devices),
        // settling on the nearest full turn so a spin never unwinds.
        const home = Math.round(s.ry / TWO_PI) * TWO_PI;
        const wantY = home + s.tx * 0.5 + idleY;
        const wantX = s.ty * 0.3 + idleX;
        s.ry = THREE.MathUtils.damp(s.ry, wantY, 3.2, dt);
        s.rx = THREE.MathUtils.damp(s.rx, wantX, 3.2, dt);
      }
    }
    s.rx = THREE.MathUtils.clamp(s.rx, -0.75, 0.75);

    g.rotation.set(s.rx, s.ry, 0);
    g.position.setY(s.reduced ? 0 : Math.sin(t * 0.6) * 0.06);
  });
}
