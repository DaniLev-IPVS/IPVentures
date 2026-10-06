import styles from "./page.module.css";
import HeroCanvas from "@/components/hero/HeroCanvas";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.headline}>Building the IPs of the future</h1>
      <HeroCanvas />
    </main>
  );
}
