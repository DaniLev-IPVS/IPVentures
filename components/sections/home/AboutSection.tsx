import styles from "./AboutSection.module.css";

export default function AboutSection() {
  return (
    <section className={`section ${styles.about}`}>
      {/* Opaque layer */}
      <div className={styles.opaqueLayer} />

      <div className={styles.container}>
        <div className={styles.textField}>
          <p className={styles.paragraph}>
            IP Ventures is a full-service creative studio that builds,
            manages, and scales intellectual property across digital
            platforms. We combine storytelling, animation, and technology
            to turn ideas into valuable, globally recognized brands.
          </p>
          <p className={styles.paragraph}>
            Our team of creators, strategists, and technologists work
            together to deliver end-to-end solutions — from concept
            development to audience growth and revenue generation.
          </p>
        </div>

        <a href="/our-team" className={styles.discoverButton}>
          Discover Our Team
        </a>

        {/* 3D Element placeholder — metallic glass frames */}
        <div className={styles.glassElement} />
      </div>
    </section>
  );
}
