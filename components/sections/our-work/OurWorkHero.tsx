import styles from "./OurWorkHero.module.css";

export default function OurWorkHero() {
  return (
    <section className={`section ${styles.hero}`}>
      {/* Video background placeholder */}
      <div className={styles.videoBg} />

      <div className={styles.container}>
        <h1 className={styles.heading}>Our Work</h1>
        <p className={styles.subheading}>
          Let&apos;s talk. We&apos;d love to hear from you
        </p>
      </div>
    </section>
  );
}
