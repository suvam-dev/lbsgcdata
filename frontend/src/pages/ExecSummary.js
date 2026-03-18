import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useData } from "../context/DataContext";
import KpiCard from "../components/KpiCard";
import SectionTitle from "../components/SectionTitle";
import CustomTooltip from "../components/CustomTooltip";
import { fmt } from "../utils/formatters";
import { COLORS, CHART } from "../utils/constants";
import styles from "./ExecSummary.module.css";

export default function ExecSummary() {
  const { summary, monthly, channels, outputTypes, inputTypes, language } = useData();
  const totalUploaded = summary.total_uploaded;
  const totalCreated = summary.total_created;
  const totalPublished = summary.total_published;
  const publishRate = summary.overall_publish_rate_pct?.toFixed(1) ?? "0.0";
  const avgMultiplier = totalUploaded > 0 ? (totalCreated / totalUploaded).toFixed(1) : "0";
  const maxCreated = Math.max(...outputTypes.map(d => d.created), 1);
  const maxUpload = Math.max(...inputTypes.map(d => d.uploaded), 1);

  return (
    <div>
      <div className={styles.alertBanner}>
        <span className={styles.alertIcon}>⚠️</span>
        <span className={styles.alertText}>
          <strong>Low publish rate alert:</strong> Only {publishRate}% of created videos are published.
          {summary.zero_publish_month_count > 0 && ` ${summary.zero_publish_month_count} months had 0 published.`}
        </span>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard label="Total Uploaded" value={fmt(totalUploaded)} sub={`${summary.total_uploaded_hrs?.toFixed(0)} hours of content`} color={CHART.uploaded} badge={summary.period} />
        <KpiCard label="Total Created" value={fmt(totalCreated)} sub={`${avgMultiplier}x output multiplier`} color={CHART.created} />
        <KpiCard label="Total Published" value={totalPublished} sub={`${summary.total_published_hrs?.toFixed(1)} hours published`} color={CHART.published} />
        <KpiCard label="Publish Rate" value={`${publishRate}%`} sub="of created videos" color={CHART.warn} badge="Low" />
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <SectionTitle sub="Monthly video counts">Funnel: Upload → Create → Publish</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: CHART.axisText }} interval="preserveStartEnd" tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: CHART.axisText }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="created" name="Created" stroke={CHART.created} fill="rgba(0,212,255,0.08)" strokeWidth={2} />
              <Area type="monotone" dataKey="uploaded" name="Uploaded" stroke={CHART.uploaded} fill="rgba(139,92,246,0.08)" strokeWidth={2} />
              <Area type="monotone" dataKey="published" name="Published" stroke={CHART.published} fill="rgba(52,211,153,0.12)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <SectionTitle sub="Top 6 channels by created volume">Channel Performance Overview</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={channels.slice(0, 6)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} />
              <XAxis dataKey="channel" tick={{ fontSize: 10, fill: CHART.axisText }} angle={-30} textAnchor="end" height={40} interval={0} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: CHART.axisText }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="created" name="Created" fill={CHART.created} opacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="published" name="Published" fill={CHART.published} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.chartCard}>
          <SectionTitle sub="By output format">Top Output Types</SectionTitle>
          {outputTypes.map((d, i) => (
            <div key={d.type} className={styles.statRow}>
              <span className={styles.statLabel}>{d.type}</span>
              <div className={styles.statBarContainer}>
                <div className={styles.statBarBg}>
                  <div className={styles.statBarFill} style={{ width: `${(d.created / maxCreated) * 100}%`, background: COLORS[i] }} />
                </div>
                <span className={styles.statValue} style={{ color: COLORS[i] }}>{fmt(d.created)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.chartCard}>
          <SectionTitle sub="By input content category">Input Type Mix</SectionTitle>
          {inputTypes.slice(0, 5).map((d, i) => (
            <div key={d.type} className={styles.statRow}>
              <span className={styles.statLabel}>{d.type}</span>
              <div className={styles.statBarContainer}>
                <div className={styles.statBarBg}>
                  <div className={styles.statBarFill} style={{ width: `${(d.uploaded / maxUpload) * 100}%`, background: COLORS[i+3] }} />
                </div>
                <span className={styles.statValue} style={{ color: COLORS[i+3] }}>{fmt(d.uploaded)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.chartCard} style={{ paddingBottom: '24px', overflow: 'visible' }}>
          <SectionTitle sub="Language distribution">Language Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={language} dataKey="created" nameKey="language" cx="50%" cy="45%" innerRadius={30} outerRadius={55}>
                {language.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: CHART.axisText, paddingTop: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
