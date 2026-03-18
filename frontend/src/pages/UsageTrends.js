import { useState } from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useData } from "../context/DataContext";
import KpiCard from "../components/KpiCard";
import SectionTitle from "../components/SectionTitle";
import CustomTooltip from "../components/CustomTooltip";
import { CHART, COLORS } from "../utils/constants";
import styles from "./UsageTrends.module.css";

export default function UsageTrends() {
  const { monthly, summary } = useData();
  const [metric, setMetric] = useState("count");

  const chartData = monthly.map(d => ({
    month: d.month,
    Uploaded: metric === "count" ? d.uploaded : +d.uploadedHrs.toFixed(1),
    Created: metric === "count" ? d.created : +d.createdHrs.toFixed(1),
    Published: metric === "count" ? d.published : +d.publishedHrs.toFixed(2),
  }));

  const last = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const growthMoM = prev?.uploaded > 0 ? ((last?.uploaded - prev?.uploaded) / prev?.uploaded * 100).toFixed(0) : "N/A";
  const peakMonth = [...monthly].sort((a, b) => b.created - a.created)[0]?.month ?? "";

  return (
    <div>
      <div className={styles.kpiGrid}>
        <KpiCard label="Peak Month (Created)" value={peakMonth} sub={`${summary.peak_publish_count} published in best month`} color={CHART.uploaded} />
        <KpiCard label={`MoM Growth (${prev?.month}→${last?.month})`} value={growthMoM !== "N/A" ? `+${growthMoM}%` : "N/A"} sub="Upload volume" color={CHART.published} />
        <KpiCard label="Total Processed Hours" value={`${summary.total_created_hrs?.toFixed(0)}h`} sub={`Across all ${summary.month_count} months`} color={CHART.created} />
        <KpiCard label="Overall Publish Rate" value={`${summary.overall_publish_rate_pct?.toFixed(1)}%`} sub="Created → Published" color={CHART.warn} badge="Low" />
      </div>

      <div className={styles.toggleContainer}>
        {["count", "hours"].map(m => (
          <button key={m} onClick={() => setMetric(m)} className={`${styles.toggleBtn} ${metric === m ? styles.toggleBtnActive : ""}`}>
            {m === "count" ? "Video Count" : "Duration (hrs)"}
          </button>
        ))}
      </div>

      <div className={styles.trendCard}>
        <SectionTitle sub="Mar 2025 – Feb 2026">Monthly Volume Trends</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: CHART.axisText }} interval="preserveStartEnd" tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: CHART.axisText }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: CHART.axisText }} />
            <Area type="monotone" dataKey="Created" stroke={CHART.created} fill="rgba(0,212,255,0.07)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="Uploaded" stroke={CHART.uploaded} fill="rgba(139,92,246,0.07)" strokeWidth={2} />
            <Area type="monotone" dataKey="Published" stroke={CHART.published} fill="rgba(52,211,153,0.12)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.smallChartCard}>
          <SectionTitle sub="Monthly publish conversion %">Publish Rate Over Time</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthly.map(d => ({ month: d.month, rate: +(d.published / (d.created || 1) * 100).toFixed(2) }))} margin={{ left: -20, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: CHART.axisText }} interval="preserveStartEnd" tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: CHART.axisText }} unit="%" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rate" name="Publish Rate %" stroke={CHART.warn} strokeWidth={2} dot={{ r: 3, fill: CHART.warn }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.smallChartCard}>
          <SectionTitle sub="Created ÷ Uploaded per month">Output Multiplier (AI Amplification)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly.map(d => ({ month: d.month, mult: +(d.created / (d.uploaded || 1)).toFixed(2) }))} margin={{ left: -20, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridLine} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: CHART.axisText }} interval="preserveStartEnd" tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: CHART.axisText }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mult" name="Multiplier" fill={COLORS[8]} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
