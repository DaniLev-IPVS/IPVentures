"use client";

import { useState } from "react";
import styles from "./Navigation.module.css";

interface NavigationProps {
  onMenuOpen?: () => void;
}

export default function Navigation({ onMenuOpen }: NavigationProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <nav
      className={`${styles.nav} ${isHovered ? styles.hovered : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={styles.logo}>IP Ventures</span>
      <button
        className={styles.menuButton}
        onClick={onMenuOpen}
        aria-label="Open menu"
      >
        <span className={styles.hamburger}>
          <span className={styles.line} />
          <span className={styles.line} />
        </span>
      </button>
    </nav>
  );
}
