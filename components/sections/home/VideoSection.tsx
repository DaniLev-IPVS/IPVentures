import styles from "./VideoSection.module.css";

export default function VideoSection() {
  return (
    <section className={`section ${styles.video}`}>
      <div className={styles.videoEmbed}>
        {/* Fullscreen video placeholder — actual video in Phase 3+ */}
        <div className={styles.placeholder}>
          <div className={styles.playButton}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="24"
                cy="24"
                r="23"
                stroke="white"
                strokeWidth="1.5"
                opacity="0.5"
              />
              <path d="M19 15L33 24L19 33V15Z" fill="white" opacity="0.8" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
