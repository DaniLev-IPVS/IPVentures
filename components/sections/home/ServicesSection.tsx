import styles from "./ServicesSection.module.css";

const services = [
  "Storyboarding",
  "Storytelling & Scriptwriting",
  "3D Visual Effects",
  "Influencer Networks",
  "2D Character Animation",
  "Web & Digital Production",
  "SM Strategy & Operations",
  "Web & Digital Asset Production",
];

export default function ServicesSection() {
  return (
    <section className={`section ${styles.services}`}>
      <div className={styles.container}>
        <h2 className={styles.title}>Services</h2>

        {/* HUD Display */}
        <div className={styles.hudDisplay}>
          {/* Central HUD circle placeholder */}
          <div className={styles.hudCircle} />

          {/* Service items arranged around HUD */}
          <div className={styles.serviceItems}>
            {services.map((service, i) => (
              <div
                key={service}
                className={styles.serviceItem}
                style={
                  {
                    "--index": i,
                    "--total": services.length,
                  } as React.CSSProperties
                }
              >
                <span className={styles.serviceName}>{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
