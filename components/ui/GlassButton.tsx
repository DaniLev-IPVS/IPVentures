"use client";

import { useRef } from "react";
import styles from "./ui.module.css";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "md" | "lg" };

/** Glass pill with a light spot that follows the cursor. */
export default function GlassButton({ size = "md", className = "", children, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <button
      ref={ref}
      onPointerMove={move}
      className={`${styles.glassBtn} ${size === "lg" ? styles.glassBtnLg : ""} ${className}`}
      {...rest}
    >
      <span className={styles.glassBtnLabel}>{children}</span>
      <span className={styles.glassBtnArrow} aria-hidden="true">→</span>
    </button>
  );
}
