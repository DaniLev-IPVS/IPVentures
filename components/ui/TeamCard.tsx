import styles from "./ui.module.css";

type Props = {
  name: string;
  role: string;
  line: string;
  linkedin?: string;
  photo?: string | null;
};

/** Painted portrait that brightens to full colour on hover. */
export default function TeamCard({ name, role, line, linkedin, photo }: Props) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <article className={styles.member}>
      <div className={styles.photo}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} loading="lazy" />
        ) : (
          <span className={styles.initials} aria-hidden="true">
            {initials}
          </span>
        )}
        <span className={styles.photoGlare} aria-hidden="true" />
      </div>
      <div className={styles.memberBody}>
        <h3 className={styles.memberName}>{name}</h3>
        <p className={styles.memberRole}>{role}</p>
        <p className={styles.memberLine}>{line}</p>
        {linkedin && (
          <a className={styles.memberLink} href={linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
