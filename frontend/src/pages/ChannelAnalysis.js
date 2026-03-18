import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import KpiCard from "../components/KpiCard";
import SectionTitle from "../components/SectionTitle";
import CustomTooltip from "../components/CustomTooltip";
import { CHART, CHART_LIGHT, CHART_DARK } from "../utils/constants";
import styles from "./ChannelAnalysis.module.css";

export default function ChannelAnalysis() {
  const { isDark } = useTheme();
  const chartMeta = isDark ? CHART_DARK : CHART_LIGHT;
  const { channels, platformsByChannel } = useData();
  const [sortBy, setSortBy] = useState("created");

  const channelsSorted = [...channels].sort((a, b) => b[sortBy] - a[sortBy]);
  const publishingChannels = channels.filter(c => c.published > 0).length;
  const neverPublished = channels.filter(c => c.published === 0).length;
  const topChannel = [...channels].sort((a, b) => b.published - a.published)[0];

  const platformCols = platformsByChannel.length > 0
    ? Object.keys(platformsByChannel[0]).filter(k => k !== "channel")
    : [];

  return (
    <div>
      <div className={styles.kpiGrid}>
        <KpiCard label="Active Channels" value={channels.length} sub="Total workspaces" color={CHART.created} />
        <KpiCard label="Publishing Channels" value={publishingChannels} sub="Have ≥1 published video" color={CHART.published} />
        <KpiCard label="Never Published" value={neverPublished} sub="Channels with 0 publishes" color={CHART.danger} badge="⚠ Risk" />
        <KpiCard label="Top Channel" value={topChannel?.channel ?? "—"} sub={`${topChannel?.published ?? 0} published, ${topChannel?.created ?? 0} created`} color={CHART.uploaded} />
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <SectionTitle sub="Upload → Create → Publish funnel">Channel Funnel</SectionTitle>
            <div className={styles.toggleContainer}>
              {["uploaded","created","published"].map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`${styles.toggleBtn} ${sortBy === s ? styles.toggleBtnActive : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={channelsSorted.slice(0, 10)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartMeta.gridLine} />
              <XAxis dataKey="channel" tick={{ fontSize: 10, fill: chartMeta.axisText }} angle={-30} textAnchor="end" height={44} interval={0} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: chartMeta.axisText }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="uploaded" name="Uploaded" fill={CHART.uploaded} opacity={0.7} radius={[2,2,0,0]} />
              <Bar dataKey="created" name="Created" fill={CHART.created} opacity={0.7} radius={[2,2,0,0]} />
              <Bar dataKey="published" name="Published" fill={CHART.published} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <SectionTitle sub="Publish conversion by channel">Publish Rate by Channel</SectionTitle>
          <div className={styles.listContainer}>
            {channels.map(c => {
              const rate = c.created > 0 ? (c.published / c.created * 100) : 0;
              const isGood = rate > 1;
              const isWarn = rate > 0 && rate <= 1;
              return (
                <div key={c.channel} className={styles.listItem}>
                  <div className={`${styles.avatar} ${isGood ? styles.avatarGood : styles.avatarBad}`}>{c.channel}</div>
                  <div className={styles.barContainer}>
                    <div className={styles.barBg}>
                      <div
                        className={`${styles.barFill} ${isGood ? styles.barFillGood : isWarn ? styles.barFillWarn : styles.barFillEmpty}`}
                        style={{ width: `${Math.min(rate * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className={styles.rateLabel}>{rate.toFixed(1)}%</div>
                  <div className={styles.countLabel}>{c.published}/{c.created}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <SectionTitle sub="Channel × Platform publishing grid">Multi-Dimensional View: Channel × Platform Publishing</SectionTitle>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={styles.thLeft}>CHANNEL</th>
                {platformCols.map(p => (
                  <th key={p} className={styles.thCenter}>{p.toUpperCase()}</th>
                ))}
                <th className={styles.thCenter}>TOTAL PUB</th>
              </tr>
            </thead>
            <tbody>
              {platformsByChannel.map(row => {
                const rowTotal = platformCols.reduce((s, p) => s + (row[p] || 0), 0);
                if (rowTotal === 0 && !channels.find(c => c.channel === row.channel)?.published) return null;
                return (
                  <tr key={row.channel} className={styles.trBody}>
                    <td className={styles.tdLeft}>Channel {row.channel}</td>
                    {platformCols.map(p => (
                      <td key={p} className={styles.tdCenter} style={{ color: row[p] > 0 ? "var(--theme-primary)" : "var(--color-text-tertiary)" }}>
                        {row[p] > 0 ? row[p] : "—"}
                      </td>
                    ))}
                    <td className={styles.tdTotal}>{rowTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
