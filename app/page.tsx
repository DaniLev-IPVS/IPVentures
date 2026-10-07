import styles from "./page.module.css";
import HeroCanvas from "@/components/hero/HeroCanvas";
import NodeField from "@/components/background/NodeField";

export default function Home() {
  return (
    <main className={styles.main}>
      <NodeField />
      <h1 className={styles.headline}>
        Building the IP<span className={styles.lower}>s</span> of the future
      </h1>
      <HeroCanvas />
    </main>
  );
}
