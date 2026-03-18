import styles from './CustomTooltip.module.css';

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.container}>
      <div className={styles.label}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className={styles.item} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
}
