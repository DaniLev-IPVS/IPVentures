import styles from "./TeamGrid.module.css";

const teamMembers = [
  { name: "Daniel Lipkovich", title: "CEO & Founder" },
  { name: "Michael Naiman", title: "COO" },
  { name: "Dan Rosenberg", title: "CTO" },
  { name: "Michael Wayne", title: "Creative Director" },
  { name: "Mikhail Bogimov", title: "Art Director" },
  { name: "Philip Brill", title: "Producer" },
  { name: "Anastasia Shvachenko", title: "Designer" },
  { name: "Angel", title: "Developer" },
  { name: "Meyani IF Louis", title: "Animator" },
  { name: "Galiya Korgembayeva", title: "Marketing" },
  { name: "John Dawnlong", title: "Writer" },
  { name: "Katerina Cabango", title: "Designer" },
  { name: "Sella Falk", title: "Producer" },
  { name: "Elizaveta Chernykh", title: "Animator" },
  { name: "Kaye Almonte", title: "Designer" },
];

export default function TeamGrid() {
  return (
    <section className={styles.teamGrid}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {teamMembers.map((member) => (
            <div key={member.name} className={styles.member}>
              <div className={styles.photoPlaceholder} />
              <span className={styles.memberName}>{member.name}</span>
              <span className={styles.memberTitle}>{member.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
