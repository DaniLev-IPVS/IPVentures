"use client";

import styles from "./NavigationOverlay.module.css";

interface NavigationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Our work", href: "/our-work" },
  { label: "Team", href: "/our-team" },
  { label: "Showreel", href: "#" },
];

export default function NavigationOverlay({
  isOpen,
  onClose,
}: NavigationOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <span className={styles.logo}>IP Ventures</span>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close menu"
        >
          <span className={styles.closeIcon}>&times;</span>
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.left}>
          {/* Video preview placeholder */}
          <div className={styles.videoPreview}>
            <div className={styles.videoPlaceholder} />
          </div>
        </div>

        <div className={styles.right}>
          <a href="#" className={styles.contactButton}>
            Contact Us
            <span className={styles.contactArrow}>&rarr;</span>
          </a>
        </div>
      </div>

      <nav className={styles.navLinks}>
        {navLinks.map((link) => (
          <a key={link.label} href={link.href} className={styles.navLink}>
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
