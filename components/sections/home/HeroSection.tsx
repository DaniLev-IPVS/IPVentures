import styles from "./HeroSection.module.css";

export default function HeroSection() {
  return (
    <section className={`section ${styles.hero}`}>
      <div className={styles.container}>
        {/* Section number */}
        <span className={styles.sectionNumber}>@1</span>

        {/* Hero heading */}
        <h1 className={styles.heading}>
          Building the next
          <br />
          generation of IP
        </h1>

        {/* 3D Interactive Element placeholder */}
        <div className={styles.interactiveElement}>
          <div className={styles.glassCardsPlaceholder}>
            {/* 3 glass cards with portfolio images — Phase 5+ */}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={styles.scrollIndicator}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
