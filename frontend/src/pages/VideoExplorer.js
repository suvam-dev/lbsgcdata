import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import styles from "./VideoExplorer.module.css";
import { fmt } from "../utils/formatters";

export default function VideoExplorer() {
  const { videos, channels, outputTypes, loading } = useData();
  const [search, setSearch] = useState("");
  const [filterChan, setFilterChan] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");

  const filtered = useMemo(() => {
    return videos.filter(v => {
      if (filterChan !== "ALL" && v.channel !== filterChan) return false;
      if (filterType !== "ALL" && v.output_type !== filterType) return false;
      if (filterStatus === "PUBLISHED" && !v.is_published) return false;
      if (filterStatus === "UNPUBLISHED" && v.is_published) return false;
      if (search && !v.title?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "recent") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "duration_desc") return (b.duration_sec || 0) - (a.duration_sec || 0);
      if (sortBy === "duration_asc") return (a.duration_sec || 0) - (b.duration_sec || 0);
      return 0;
    });
  }, [videos, search, filterChan, filterType, filterStatus, sortBy]);

  if (loading) return <div className={styles.loading}>Loading video database...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <input 
            type="text" 
            placeholder="Search titles..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterSection}>
          <div className={styles.filterTitle}>Channel</div>
          <select value={filterChan} onChange={e => setFilterChan(e.target.value)} className={styles.selectInput}>
            <option value="ALL">All Channels ({channels.length})</option>
            {channels.map(c => <option key={c.channel} value={c.channel}>{c.channel}</option>)}
          </select>

          <div className={styles.filterTitle}>Output Type</div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={styles.selectInput}>
            <option value="ALL">All Types ({outputTypes.length})</option>
            {outputTypes.map(t => <option key={t.type} value={t.type}>{t.type}</option>)}
          </select>

          <div className={styles.filterTitle}>Publish Status</div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.selectInput}>
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="UNPUBLISHED">Unpublished Only</option>
          </select>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.listHeader}>
          <div className={styles.resultCount}>
            Showing <strong className={styles.resultHighlight}>{fmt(filtered.length)}</strong> videos
          </div>
          <div>
            <span className={styles.sortLabel}>SORT BY:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={styles.sortSelect}>
              <option value="recent">Newest First</option>
              <option value="duration_desc">Duration (High to Low)</option>
              <option value="duration_asc">Duration (Low to High)</option>
            </select>
          </div>
        </div>

        <div className={styles.listScrollArea}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>No videos match the current filters.</div>
          ) : (
            filtered.slice(0, 100).map(v => (
              <div key={v.video_id} className={styles.videoCard}>
                <div className={styles.videoHeader}>
                  <div className={styles.videoTitle}>{v.title || "Untitled Video"}</div>
                  <div className={`${styles.videoStatus} ${v.is_published ? styles.statusPublished : styles.statusUnpublished}`}>
                    {v.is_published ? "PUBLISHED" : "UNPUBLISHED"}
                  </div>
                </div>
                
                <div className={styles.videoMetrics}>
                  <div className={styles.metric}>CREATED: <span className={styles.metricValue}>{v.created_at?.split('T')[0] || "Unknown"}</span></div>
                  <div className={styles.metric}>CHANNEL: <span className={styles.metricValue}>{v.channel}</span></div>
                  <div className={styles.metric}>TYPE: <span className={styles.metricValue}>{v.output_type}</span></div>
                  <div className={styles.metric}>DUR: <span className={styles.metricValue}>{v.duration_sec ? (v.duration_sec/60).toFixed(1)+'m' : '--'}</span></div>
                </div>

                {v.platforms && v.platforms.length > 0 && (
                  <div className={styles.platformsContainer}>
                    {v.platforms.map(p => (
                      <span key={p} className={styles.platformBadge}>{p}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {filtered.length > 100 && (
             <div className={styles.emptyState}>+ {fmt(filtered.length - 100)} more (results truncated)</div>
          )}
        </div>
      </div>
    </div>
  );
}
