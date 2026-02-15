import styles from "./ClientsSection.module.css";

const clientLogos = [
  "Yoola",
  "JCorp",
  "PMI Kids World",
  "IGLOO",
  "CreatorFi",
  "Amazon",
];

export default function ClientsSection() {
  return (
    <section className={`section ${styles.clients}`}>
      <div className={styles.container}>
        <span className={styles.label}>Our Clients</span>
        <h2 className={styles.heading}>Trusted by the best</h2>

        {/* 3D Interactive Elements 7-8 placeholder */}
        <div className={styles.glassCards}>
          <div className={styles.card} />
          <div className={styles.card} />
        </div>

        {/* Logo slider */}
        <div className={styles.sliderWrapper}>
          <div className={styles.fadeMask} />
          <div className={styles.slider}>
            {clientLogos.map((name) => (
              <div key={name} className={styles.logoItem}>
                <span className={styles.logoText}>{name}</span>
              </div>
            ))}
            {/* Duplicate for infinite scroll effect — Phase 4+ */}
            {clientLogos.map((name) => (
              <div key={`dup-${name}`} className={styles.logoItem}>
                <span className={styles.logoText}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
