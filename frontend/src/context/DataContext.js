import { useState, useEffect, createContext, useContext } from "react";
import { SkeletonDashboard } from "../components/Skeleton";
import styles from "./DataContext.module.css";

export const API = process.env.REACT_APP_API_URL || 
  (window.location.hostname === "localhost" ? "http://localhost:8000/api" : "/api");
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
      fetch(`${base}/channel-users`).then(r => r.json()),
    ])
      .then(([summary, monthly, channels, users, inputTypes, outputTypes, language, platforms, channelUsersResp]) => {
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


        const channelUsers = (channelUsersResp.data || []).map(d => ({
          ...d,
          uploaded_hrs: d.uploaded_hrs ?? 0,
          created_hrs: d.created_hrs ?? 0,
          published_hrs: d.published_hrs ?? 0,
        }));

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
          channelUsers,
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
