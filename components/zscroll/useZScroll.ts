"use client";

import { useCallback, useEffect, useRef } from "react";

type Options = {
  /** Number of stops on the track (0 … count-1). */
  count: number;
  /** Input is ignored while true (e.g. a modal is open). */
  paused?: boolean;
  /** Called every animation frame with the eased camera position. */
  onFrame: (progress: number, dt: number) => void;
  /** Called when the nearest stop changes. */
  onStop?: (index: number) => void;
  initial?: number;
};

const WHEEL_GAIN = 0.0011; // track units per wheel pixel
const TOUCH_GAIN = 0.0042; // track units per finger pixel
const SNAP_DELAY = 170; // ms of quiet before settling on a stop
const EASE = 5.2; // higher = camera catches up faster
const COMMIT = 0.06; // share of a stop a wheel gesture must travel to commit

/**
 * Virtual scroll along one axis: wheel, touch and keys move a target position
 * on a track of stops; the camera eases toward it and settles on the nearest
 * stop once input goes quiet. Nothing re-renders per frame; consumers apply
 * transforms in `onFrame`.
 */
export function useZScroll({ count, paused = false, onFrame, onStop, initial = 0 }: Options) {
  const target = useRef(initial);
  const current = useRef(initial);
  const stop = useRef(Math.round(initial));
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(paused);
  const frameRef = useRef(onFrame);
  const stopRef = useRef(onStop);

  useEffect(() => {
    pausedRef.current = paused;
    frameRef.current = onFrame;
    stopRef.current = onStop;
  });

  // Where the current wheel gesture started (a stop index), or null between gestures.
  const gestureFrom = useRef<number | null>(null);

  const max = count - 1;
  const clamp = useCallback((v: number) => Math.min(max, Math.max(0, v)), [max]);

  const goTo = useCallback(
    (i: number) => {
      if (snapTimer.current) clearTimeout(snapTimer.current);
      gestureFrom.current = null;
      target.current = clamp(Math.round(i));
    },
    [clamp],
  );

  /**
   * Once the wheel goes quiet, settle on a stop. A deliberate push past
   * COMMIT in either direction moves to the neighbouring stop; long pushes
   * can travel several stops; tiny nudges spring back.
   */
  const scheduleSnap = useCallback(() => {
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      const from = gestureFrom.current ?? Math.round(target.current);
      const moved = target.current - from;
      const steps =
        Math.abs(moved) < COMMIT ? 0 : Math.sign(moved) * Math.max(1, Math.round(Math.abs(moved)));
      target.current = clamp(from + steps);
      gestureFrom.current = null;
    }, SNAP_DELAY);
  }, [clamp]);

  // Animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-EASE * dt);
      current.current += (target.current - current.current) * k;
      if (Math.abs(target.current - current.current) < 0.0004) current.current = target.current;
      frameRef.current(current.current, dt);
      const s = Math.round(current.current);
      if (s !== stop.current) {
        stop.current = s;
        stopRef.current?.(s);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Wheel / trackpad
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (pausedRef.current || e.ctrlKey) return; // ctrl+wheel = pinch zoom
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const delta = Math.max(-120, Math.min(120, e.deltaY * unit));
      if (gestureFrom.current === null) gestureFrom.current = Math.round(target.current);
      target.current = clamp(target.current + delta * WHEEL_GAIN);
      scheduleSnap();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [clamp, scheduleSnap]);

  // Touch: vertical swipes drive the camera; horizontal swipes are left alone
  // so rows that scroll sideways keep working.
  useEffect(() => {
    let y0 = 0, x0 = 0, yPrev = 0, tPrev = 0, vel = 0;
    let axis: "x" | "y" | null = null;
    const start = (e: TouchEvent) => {
      if (pausedRef.current) return;
      const t = e.touches[0];
      x0 = t.clientX;
      y0 = yPrev = t.clientY;
      tPrev = performance.now();
      vel = 0;
      axis = null;
      if (snapTimer.current) clearTimeout(snapTimer.current);
    };
    const move = (e: TouchEvent) => {
      if (pausedRef.current) return;
      const t = e.touches[0];
      if (!axis) {
        const dx = Math.abs(t.clientX - x0);
        const dy = Math.abs(t.clientY - y0);
        if (dx < 6 && dy < 6) return;
        axis = dy >= dx ? "y" : "x";
      }
      if (axis !== "y") return;
      e.preventDefault();
      const now = performance.now();
      const dy = yPrev - t.clientY; // finger up = forward
      vel = dy / Math.max(1, now - tPrev); // px per ms
      yPrev = t.clientY;
      tPrev = now;
      target.current = clamp(target.current + dy * TOUCH_GAIN);
    };
    const end = () => {
      if (axis !== "y") return;
      const flick = Math.abs(vel) > 0.35 ? Math.sign(vel) * 0.5 : 0;
      target.current = clamp(Math.round(target.current + flick));
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, [clamp]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      const now = Math.round(target.current);
      const map: Record<string, number> = {
        ArrowDown: now + 1, PageDown: now + 1, ArrowRight: now + 1,
        ArrowUp: now - 1, PageUp: now - 1, ArrowLeft: now - 1,
        Home: 0, End: max,
      };
      let next = map[e.key];
      if (e.key === " " && !el.closest("button, a")) next = e.shiftKey ? now - 1 : now + 1;
      if (next === undefined) return;
      e.preventDefault();
      goTo(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, max]);

  return { goTo, progress: current };
}
