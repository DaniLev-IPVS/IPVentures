import styles from "./HiringSection.module.css";

const jobs = [
  {
    title: "Product Designer",
    type: "Full time",
    location: "Remote",
  },
  {
    title: "Frontend Developer",
    type: "Full time",
    location: "Remote",
  },
  {
    title: "Senior Visual Designer",
    type: "Full time",
    location: "Remote",
  },
];

export default function HiringSection() {
  return (
    <section className={styles.hiring}>
      <div className={styles.container}>
        <div className={styles.jobList}>
          {jobs.map((job) => (
            <div key={job.title} className={styles.jobRow}>
              <span className={styles.jobTitle}>{job.title}</span>
              <div className={styles.jobMeta}>
                <span className={styles.jobType}>{job.type}</span>
                <span className={styles.jobSep}>&middot;</span>
                <span className={styles.jobLocation}>{job.location}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ctaWrapper}>
          <a href="#" className={styles.ctaButton}>
            Work with us
          </a>
        </div>
      </div>
    </section>
  );
}
