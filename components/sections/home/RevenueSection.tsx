import styles from "./RevenueSection.module.css";

export default function RevenueSection() {
  return (
    <section className={`section ${styles.revenue}`}>
      <div className={styles.container}>
        <h2 className={styles.heading}>
          The challenge is turning
          <br />
          attention into outcomes
        </h2>

        <div className={styles.statBlock}>
          <span className={styles.stat}>$40M+</span>
          <span className={styles.statLabel}>Measurable revenue unlocked</span>
        </div>

        {/* 3D Interactive Elements 4-6 placeholder */}
        <div className={styles.glassCards}>
          <div className={styles.card} />
          <div className={styles.card} />
          <div className={styles.card} />
        </div>
      </div>
    </section>
  );
}
