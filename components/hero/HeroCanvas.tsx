"use client";

import dynamic from "next/dynamic";
import styles from "./HeroCanvas.module.css";

// The Three.js scene is client-only and loads after the headline paints.
const LogoScene = dynamic(() => import("./LogoScene"), {
  ssr: false,
  loading: () => null,
});

/** `running`: render every frame only while the hero is the current stop. */
export default function HeroCanvas({ running = true }: { running?: boolean }) {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.glow} />
      <LogoScene running={running} />
    </div>
  );
}
