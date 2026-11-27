"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ui.module.css";

type Props = {
  value: number;
  suffix?: string;
  label: string;
  /** Start counting when this flips true (e.g. the camera arrives at the plane). */
  play?: boolean;
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** A proof number that counts up once, then holds. */
export default function StatCard({ value, suffix = "", label, play = true }: Props) {
  const [shown, setShown] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (!play || done.current) return;
    done.current = true;
    // Reduced motion: jump straight to the final number on the first frame.
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = dur ? Math.min(1, (t - t0) / dur) : 1;
      setShown(value * (1 - Math.pow(1 - p, 4))); // ease-out quart
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, value]);

  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>
        {/* Small numbers (1B, 1M) tick through tenths so the count still reads as motion */}
        {value < 10 && shown < value ? shown.toFixed(1) : fmt(shown)}
        <span className={styles.statSuffix}>{suffix}</span>
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
