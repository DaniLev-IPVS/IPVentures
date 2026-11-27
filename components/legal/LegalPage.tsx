import Link from "next/link";
import styles from "./LegalPage.module.css";

type Props = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

/** Plain, readable page for policies. The site's body doesn't scroll, so this does. */
export default function LegalPage({ title, updated, children }: Props) {
  return (
    <div className={styles.scroller}>
      <article className={styles.page}>
        <Link href="/" className={styles.back}>
          ← IP Ventures
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated {updated}</p>
        <div className={styles.body}>{children}</div>
        <p className={styles.contact}>
          Questions? Email <a href="mailto:info@ipventures.io">info@ipventures.io</a>.
        </p>
      </article>
    </div>
  );
}
