import styles from "./PartnersSection.module.css";

const partnerLogos = [
  "Partner 1",
  "Partner 2",
  "Partner 3",
  "Partner 4",
  "Partner 5",
  "Partner 6",
];

export default function PartnersSection() {
  return (
    <section className={`section ${styles.partners}`}>
      {/* Lines background layer */}
      <div className={styles.linesBackground} aria-hidden="true" />

      <div className={styles.container}>
        <h2 className={styles.heading}>Our Partners</h2>

        {/* Logo marquee/slider */}
        <div className={styles.sliderWrapper}>
          <div className={styles.slider}>
            {partnerLogos.map((name) => (
              <div key={name} className={styles.logoItem}>
                <span className={styles.logoText}>{name}</span>
              </div>
            ))}
            {partnerLogos.map((name) => (
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
