import styles from "./LiveImpressionsSection.module.css";

export default function LiveImpressionsSection() {
  return (
    <section className={`section ${styles.impressions}`}>
      <div className={styles.container}>
        <h2 className={styles.heading}>
          Attention is today&apos;s primary
          <br />
          driver of IP value
        </h2>

        <div className={styles.statBlock}>
          <span className={styles.counter}>12,554,214,779</span>
          <span className={styles.statLabel}>Live Portfolio Impressions</span>
        </div>

        {/* 3D Interactive Elements 1-3 placeholder */}
        <div className={styles.glassCards}>
          <div className={styles.card} />
          <div className={styles.card} />
          <div className={styles.card} />
        </div>
      </div>
    </section>
  );
}
