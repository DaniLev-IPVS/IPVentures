"use client";

import dynamic from "next/dynamic";
import styles from "./HeroCanvas.module.css";

// The Three.js scene is client-only and loads after the headline paints.
const LogoScene = dynamic(() => import("./LogoScene"), {
  ssr: false,
  loading: () => null,
});

export default function HeroCanvas() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.glow} />
      <LogoScene />
    </div>
  );
}
