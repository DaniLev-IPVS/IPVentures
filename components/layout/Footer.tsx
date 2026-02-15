import styles from "./Footer.module.css";

const footerNavLinks = [
  { label: "Home", href: "/" },
  { label: "Our work", href: "/our-work" },
  { label: "Team", href: "/our-team" },
  { label: "Showreel", href: "#" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.columns}>
          {/* Left Column — Contact */}
          <div className={styles.column}>
            <span className={styles.label}>Let&apos;s talk</span>
            <a href="#" className={styles.contactLink}>
              Contact us
              <span className={styles.arrow}>&rarr;</span>
            </a>
            <div className={styles.legalLinks}>
              <a href="#" className={styles.legalLink}>
                Privacy Policy
              </a>
              <a href="#" className={styles.legalLink}>
                Terms Of Service
              </a>
            </div>
          </div>

          {/* Right Column — Navigation */}
          <div className={styles.column}>
            <span className={styles.label}>Navigation</span>
            <nav className={styles.navList}>
              {footerNavLinks.map((link) => (
                <a key={link.label} href={link.href} className={styles.navLink}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Giant IP Ventures text */}
        <div className={styles.bigText}>
          <span>IP ventures</span>
        </div>
      </div>
    </footer>
  );
}
