import styles from './SectionTitle.module.css';

export default function SectionTitle({ children, sub }) {
  return (
    <div className={styles.container}>
      <div className={styles.accent} />
      <div className={styles.textGroup}>
        <div className={styles.title}>{children}</div>
        {sub && <div className={styles.sub}>{sub}</div>}
      </div>
    </div>
  );
}
