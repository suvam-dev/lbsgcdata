import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import KpiCard from "../components/KpiCard";
import SectionTitle from "../components/SectionTitle";
import CustomTooltip from "../components/CustomTooltip";
import { pct } from "../utils/formatters";
import { COLORS, CHART, CHART_LIGHT, CHART_DARK } from "../utils/constants";
import styles from "./TypeMixFunnel.module.css";

export default function TypeMixFunnel() {
  const { isDark } = useTheme();
  const chartMeta = isDark ? CHART_DARK : CHART_LIGHT;
  const data = useData();
  const { outputTypes, inputTypes, platforms, language } = data;

  const bestOutputRate = outputTypes.length
    ? outputTypes.reduce((best, d) => {
        const r = d.created > 0 ? d.published / d.created : 0;
        return r > best.rate ? { type: d.type, rate: r } : best;
      }, { type: "", rate: 0 })
    : { type: "—", rate: 0 };

  const highestVolume = outputTypes.length
    ? outputTypes.reduce((top, d) => d.created > top.created ? d : top, outputTypes[0])
    : { type: "—", created: 0 };

  const totalLangUploaded = language.reduce((s, d) => s + (d.uploaded || 0), 0);
  const english = language.find(d => (d.language || "").toLowerCase().startsWith("en"));
  const englishPct = totalLangUploaded > 0 && english
    ? ((english.uploaded / totalLangUploaded) * 100).toFixed(0)
    : "—";

  return (
    <div>
      <div className={styles.kpiGrid}>
        <KpiCard label="Best Publish Rate" value={`${(bestOutputRate.rate * 100).toFixed(2)}%`} sub={bestOutputRate.type} color={CHART.published} />
        <KpiCard label="Highest Volume" value={highestVolume.type} sub={`${(highestVolume.created || 0).toLocaleString()} created`} color={CHART.created} />
        <KpiCard label="English Dominance" value={`${englishPct}%`} sub="Of all uploads (en)" color={CHART.uploaded} />
        <KpiCard label="Input Types" value={inputTypes.length} sub="Distinct input categories" color={CHART.danger} />
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.card}>
          <SectionTitle sub="Created vs Published by output type">Output Type Funnel</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={outputTypes} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartMeta.gridLine} />
              <XAxis type="number" tick={{ fontSize: 10, fill: chartMeta.axisText }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: chartMeta.axisText }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="created" name="Created" fill={CHART.created} opacity={0.7} radius={[0,3,3,0]} />
              <Bar dataKey="published" name="Published" fill={CHART.published} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <SectionTitle sub="Upload volumes by content category">Input Type Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={inputTypes.slice(0,7)} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartMeta.gridLine} />
              <XAxis type="number" tick={{ fontSize: 10, fill: chartMeta.axisText }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: chartMeta.axisText }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="uploaded" name="Uploaded" fill={CHART.uploaded} opacity={0.8} radius={[0,3,3,0]} />
              <Bar dataKey="published" name="Published" fill={CHART.warn} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.threeGrid}>
        <div className={styles.card}>
          <SectionTitle sub="Publish conversion by output format">Output Type Publish Rates</SectionTitle>
          {outputTypes.map((d, i) => {
            const rate = d.created > 0 ? (d.published / d.created * 100).toFixed(2) : "0.00";
            const color = COLORS[i % COLORS.length];
            return (
              <div key={d.type} className={styles.itemRow}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{d.type}</span>
                  <span className={styles.itemRate} style={{ color }}>{rate}%</span>
                </div>
                <div className={styles.itemBarBg}>
                  <div className={styles.itemBarFill} style={{ width: `${Math.min(parseFloat(rate) * 50, 100)}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.card}>
          <SectionTitle sub="Platform publish distribution">Publishing Platforms</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={platforms.filter(p => p.count > 0)} dataKey="count" nameKey="platform" cx="50%" cy="50%" innerRadius={35} outerRadius={65} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {platforms.filter(p => p.count > 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <SectionTitle sub="Language upload & publish breakdown">Language Usage</SectionTitle>
          {language.map((d, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={d.language} className={styles.langRow}>
                <div className={styles.itemHeader}>
                  <span className={styles.langName}>{d.language}</span>
                  <span className={styles.langRate} style={{ color }}>{pct(d.published, d.created)} pub rate</span>
                </div>
                <div className={styles.langBarBg}>
                  <div className={styles.langBarFill} style={{ width: `${totalLangUploaded > 0 ? (d.uploaded / totalLangUploaded) * 100 : 0}%`, background: color }} />
                </div>
                <div className={styles.langSub}>{(d.uploaded || 0).toLocaleString()} uploaded · {d.published} published</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
