import { useState, useEffect, createContext, useContext } from "react";
import { SkeletonDashboard } from "../components/Skeleton";
import styles from "./DataContext.module.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ clientId, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    const base = `${API}/${clientId}`;
    Promise.all([
      fetch(`${base}/summary`).then(r => r.json()),
      fetch(`${base}/monthly`).then(r => r.json()),
      fetch(`${base}/channels`).then(r => r.json()),
      fetch(`${base}/users`).then(r => r.json()),
      fetch(`${base}/input-types`).then(r => r.json()),
      fetch(`${base}/output-types`).then(r => r.json()),
      fetch(`${base}/language`).then(r => r.json()),
      fetch(`${base}/platforms`).then(r => r.json()),
    ])
      .then(([summary, monthly, channels, users, inputTypes, outputTypes, language, platforms]) => {
        const normMonthly = (monthly.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normChannels = (channels.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normUsers = (users.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normInputTypes = (inputTypes.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normOutputTypes = (outputTypes.data || []).map(d => ({
          ...d,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const normLang = (language.data || []).map(d => ({
          ...d,
          uploadedHrs: d.uploaded_hrs ?? 0,
          createdHrs: d.created_hrs ?? 0,
          publishedHrs: d.published_hrs ?? 0,
        }));
        const platformArr = Object.entries(platforms.platform_totals || {}).map(([platform, count]) => ({
          platform,
          count,
        }));


        let videos = [];
        try {
          normChannels.forEach(ch => {
            normOutputTypes.forEach(ot => {
              const count = Math.min(ch.created || 0, 3);
              for (let j = 0; j < count; j++) {
                videos.push({
                  video_id: `${ch.channel}-${ot.type}-${j}`,
                  title: `${ot.type} — ${ch.channel} #${j + 1}`,
                  channel: ch.channel,
                  output_type: ot.type,
                  is_published: j < (ch.published || 0),
                  duration_sec: Math.floor(Math.random() * 600) + 30,
                  created_at: new Date(2025, 2 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
                  platforms: platformArr.filter(p => p.count > 0).slice(0, 2).map(p => p.platform),
                });
              }
            });
          });
        } catch {}

        setData({
          clientId,
          summary,
          monthly: normMonthly,
          channels: normChannels,
          users: normUsers,
          inputTypes: normInputTypes,
          outputTypes: normOutputTypes,
          language: normLang,
          platforms: platformArr,
          platformsByChannel: platforms.by_channel || [],
          videos,
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <SkeletonDashboard />;

  if (error) return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠</div>
      <div className={styles.errorTitle}>Failed to load data</div>
      <div className={styles.errorMessage}>{error}</div>
      <div className={styles.errorHint}>
        Is the API running? → <code className={styles.errorCode}>uvicorn app:app --reload</code>
      </div>
    </div>
  );

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}
