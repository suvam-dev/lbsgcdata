import styles from "./Skeleton.module.css";

export function SkeletonBlock({ width = "100%", height = 20, radius = 8, style }) {
  return (
    <div
      className={styles.shimmer}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonDashboard() {
  return (
    <div className={styles.page}>
      <div className={styles.kpiRow}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.kpiCard}>
            <SkeletonBlock height={12} width="60%" radius={6} />
            <SkeletonBlock height={36} width="80%" radius={8} style={{ marginTop: 12 }} />
            <SkeletonBlock height={10} width="50%" radius={6} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>
      <div className={styles.chartRow}>
        <div className={styles.chartCard}>
          <SkeletonBlock height={14} width="40%" radius={6} />
          <SkeletonBlock height={200} width="100%" radius={12} style={{ marginTop: 16 }} />
        </div>
        <div className={styles.chartCard}>
          <SkeletonBlock height={14} width="55%" radius={6} />
          <SkeletonBlock height={200} width="100%" radius={12} style={{ marginTop: 16 }} />
        </div>
      </div>
      <div className={styles.bottomRow}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={styles.chartCard}>
            <SkeletonBlock height={14} width="45%" radius={6} />
            <SkeletonBlock height={160} width="100%" radius={12} style={{ marginTop: 16 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
