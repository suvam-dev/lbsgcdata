import styles from './KpiCard.module.css';

export default function KpiCard({ label, value, sub, color = "var(--theme-primary)", trend, badge }) {
  return (
    <div className={styles.card}>
      <div className={styles.topBar} style={{ background: color }} />
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
      {badge && <div className={styles.badge}>{badge}</div>}
    </div>
  );
}
