"use client";

import { useEffect, useRef, useState } from "react";
import { sections } from "@/lib/content";
import styles from "./SideNav.module.css";

type Props = {
  /** Index into `sections` of the stop the camera is closest to. */
  active: number;
  onSelect: (index: number) => void;
  onContact: () => void;
};

/**
 * Right-edge navigation. Idle it is a slim glass capsule of dots (the current
 * stop glows); on hover or focus it widens and the section names slide in.
 * Touch devices: first tap opens it, a tap outside closes it.
 * Phones (≤760px): a bottom glass pill instead (mark, dots, contact) where
 * every tap acts at once.
 */
const isBar = () => window.matchMedia("(max-width: 760px)").matches;
export default function SideNav({ active, onSelect, onContact }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  // On touch, the first tap only expands the capsule.
  const guard = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" && !open && !isBar()) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    }
  };

  return (
    <nav
      ref={ref}
      className={`${styles.nav} ${open ? styles.open : ""}`}
      aria-label="Sections"
      onPointerDownCapture={guard}
      onClickCapture={(e) => {
        if (!open && !isBar() && window.matchMedia("(hover: none)").matches) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <button className={styles.mark} onClick={() => onSelect(0)} aria-label="IP Ventures, back to top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/ipv-mark-white.svg" alt="" width={16} height={16} />
      </button>

      <ul className={styles.list}>
        {sections.map((s, i) => (
          <li key={s.id}>
            <button
              className={`${styles.item} ${i === active ? styles.active : ""}`}
              onClick={() => onSelect(i)}
              aria-current={i === active ? "true" : undefined}
              aria-label={s.label}
            >
              <i className={styles.dot} aria-hidden="true" />
              <span className={styles.label}>{s.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <button className={styles.contact} onClick={onContact} aria-label="Contact">
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 4h12v8H2z M2 4l6 5 6-5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        <span className={styles.contactLabel}>Contact</span>
      </button>
    </nav>
  );
}
