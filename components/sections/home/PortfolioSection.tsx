import styles from "./PortfolioSection.module.css";

export default function PortfolioSection() {
  return (
    <section className={`section ${styles.portfolio}`}>
      {/* Dark opaque layer */}
      <div className={styles.opaqueLayer} />

      <div className={styles.container}>
        {/* Video grid — 6 video embeds */}
        <div className={styles.videoGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.videoEmbed}>
              <div className={styles.videoPlaceholder}>
                <span className={styles.videoLabel}>Video {i + 1}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Our Work CTA */}
        <div className={styles.ctaWrapper}>
          <a href="/our-work" className={styles.ctaButton}>
            Our Work
          </a>
        </div>
      </div>
    </section>
  );
}
