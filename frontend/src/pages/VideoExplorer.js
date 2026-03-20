import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import KpiCard from "../components/KpiCard";
import { CHART } from "../utils/constants";
import styles from "./VideoExplorer.module.css";
import { fmt } from "../utils/formatters";

const pct = (a, b) => (b === 0 ? "0.00%" : `${((a / b) * 100).toFixed(2)}%`);

export default function VideoExplorer() {
  const { channels, channelUsers, platforms } = useData();

  const [search, setSearch] = useState("");
  const [filterChan, setFilterChan] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [sortBy, setSortBy] = useState("uploaded");
  const [sortDir, setSortDir] = useState("desc");

  // Unique user list from real data
  const allUsers = useMemo(() => {
    if (!channelUsers) return [];
    return [...new Set(channelUsers.map((r) => r.user))].sort();
  }, [channelUsers]);

  // Filter + sort
  const filtered = useMemo(() => {
    let rows = channelUsers || [];
    if (filterChan !== "all") rows = rows.filter((r) => r.channel === filterChan);
    if (filterUser !== "all") rows = rows.filter((r) => r.user === filterUser);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.channel?.toLowerCase().includes(q) ||
          r.user?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      return dir * ((a[sortBy] || 0) - (b[sortBy] || 0));
    });
  }, [channelUsers, filterChan, filterUser, search, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortBy(col); setSortDir("desc"); }
  };
  const sortIcon = (col) => (sortBy === col ? (sortDir === "desc" ? " ↓" : " ↑") : "");

  // DQ summary stats from real data
  const totalChannels = channels.length;
  const neverPublished = channels.filter((c) => c.published === 0).length;
  const autoUpload = (channelUsers || []).find((r) =>
    r.user?.toLowerCase().includes("auto")
  );
  const missingPlatformPct = platforms.length > 0
    ? Math.round((platforms.filter((p) => p.count === 0).length / platforms.length) * 100)
    : 0;

  return (
    <div>
      {/* KPI Cards — data quality focused */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Total Channels"
          value={totalChannels}
          sub={`${totalChannels - neverPublished} with ≥1 publish`}
          color={CHART.created}
        />
        <KpiCard
          label="Never Published"
          value={neverPublished}
          sub="Channels with 0 publishes"
          color={CHART.danger}
          badge="⚠ Risk"
        />
        <KpiCard
          label="Inactive Platforms"
          value={`${missingPlatformPct}%`}
          sub="Platforms with 0 publishes"
          color={CHART.warn}
          badge="DQ"
        />
        <KpiCard
          label="Auto-Upload"
          value={fmt(autoUpload?.uploaded ?? 0)}
          sub="Videos from automation"
          color={CHART.uploaded}
        />
      </div>

      {/* Data Quality Alert */}
      <div className={styles.dqBanner}>
        <span>🔍</span>
        <div className={styles.dqText}>
          <strong>Data Quality Observations:</strong>{" "}
          {neverPublished} of {totalChannels} channels have never published.
          {" "}
          {autoUpload ? `Auto Upload generates ${fmt(autoUpload.uploaded)} videos with 0 published.` : ""}
          {" "}
          Several platforms show 0 publishes despite active creation.
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by channel or user..."
          className={styles.searchInput}
        />
        <select value={filterChan} onChange={(e) => setFilterChan(e.target.value)} className={styles.selectInput}>
          <option value="all">All Channels</option>
          {channels.map((c) => (
            <option key={c.channel} value={c.channel}>Channel {c.channel}</option>
          ))}
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className={styles.selectInput}>
          <option value="all">All Users</option>
          {allUsers.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Styled Table using Real Data */}
      <div className={styles.mainContent} style={{ height: "auto", borderRadius: 12, overflowX: "auto", overflowY: "hidden", background: "#111113", border: "1px solid #222" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-mono)" }}>
          <thead>
            <tr style={{ background: "transparent", borderBottom: "1px solid #222" }}>
              {[
                { key: "channel", label: "CHANNEL" },
                { key: "user", label: "USER" },
                { key: "uploaded", label: "UPLOADED" },
                { key: "created", label: "CREATED" },
                { key: "publish_rate_pct", label: "PUB RATE" },
                { key: "published", label: "PUBLISHED" },
                { key: "uploaded_hrs", label: "HOURS (UP/CR)" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  style={{
                    textAlign: "left",
                    padding: "16px 20px",
                    color: sortBy === key ? "#fff" : "#666",
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    userSelect: "none"
                  }}
                >
                  {label}{sortIcon(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState} style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                  No rows match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const rateFormatted = pct(r.published, r.created);
                return (
                  <tr
                    key={`${r.channel}-${r.user}`}
                    style={{
                      borderBottom: i === filtered.length - 1 ? "none" : "1px solid #222",
                      background: "transparent",
                    }}
                  >
                    <td style={{ padding: "16px 20px", color: "#ddd", fontWeight: 600 }}>
                      {r.channel}
                    </td>
                    <td style={{ padding: "16px 20px", color: (r.user || "").includes("Unknown") || (r.user || "").includes("Auto") ? "#ef4444" : "#9ca3af", fontWeight: (r.user || "").includes("Unknown") || (r.user || "").includes("Auto") ? 600 : 400 }}>
                      {r.user}
                    </td>
                    <td style={{ padding: "16px 20px", color: "#6b7280" }}>
                      {fmt(r.uploaded || 0)}
                    </td>
                    <td style={{ padding: "16px 20px", color: "#6b7280" }}>
                      {fmt(r.created || 0)}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                        {rateFormatted}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {r.published > 0 ? (
                        <span style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                          {fmt(r.published)}
                        </span>
                      ) : (
                        <span style={{ background: "rgba(255, 255, 255, 0.05)", color: "#6b7280", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                          0
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px", color: "var(--color-accent-cyan)" }}>
                      {(r.uploaded_hrs || 0).toFixed(1)}h / {(r.created_hrs || 0).toFixed(1)}h
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div
          style={{
            padding: "16px 20px",
            fontSize: 11,
            color: "#666",
            fontFamily: "var(--font-mono)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Showing {filtered.length} of {(channelUsers || []).length} rows (Channel × User breakdown)
          </span>
          <span style={{ color: "#888", cursor: "pointer" }}>Export CSV ↓</span>
        </div>
      </div>
    </div>
  );
}
