import styles from "./ProjectList.module.css";

const filterTabs = ["All", "Mobile app", "App development", "Branding"];

const projects = [
  { name: "Snek", description: "Character IP & Animation", growth: "+300%" },
  { name: "Ponks", description: "Brand Development", growth: "+20%" },
  { name: "Pucca", description: "Digital Content Strategy", growth: "+80%" },
  { name: "Project 4", description: "Web Production", growth: "+140%" },
];

export default function ProjectList() {
  return (
    <section className={styles.projectList}>
      <div className={styles.container}>
        {/* Filter tabs */}
        <div className={styles.filters}>
          {filterTabs.map((tab, i) => (
            <button
              key={tab}
              className={`${styles.filterTab} ${i === 0 ? styles.active : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Project rows */}
        <div className={styles.projects}>
          {projects.map((project) => (
            <a key={project.name} href="#" className={styles.projectRow}>
              <div className={styles.projectLogo}>
                <div className={styles.logoPlaceholder} />
              </div>
              <div className={styles.projectInfo}>
                <span className={styles.projectName}>{project.name}</span>
                <span className={styles.projectDesc}>
                  {project.description}
                </span>
              </div>
              <span className={styles.projectGrowth}>{project.growth}</span>
              <span className={styles.projectArrow}>&rarr;</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
