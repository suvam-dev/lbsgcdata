import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import KpiCard from "../components/KpiCard";
import { CHART } from "../utils/constants";
import styles from "./VideoExplorer.module.css";
import { fmt } from "../utils/formatters";

const pct = (a, b) => (b === 0 ? "0.00%" : `${((a / b) * 100).toFixed(2)}%`);

export default function VideoExplorer() {
  const { channels, users, inputTypes, outputTypes, channelUsers, platforms } = useData();

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
  const missingPlatformPct =
    platforms.length > 0
      ? Math.round(
          (platforms.filter((p) => p.count === 0).length / platforms.length) * 100
        )
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
          {autoUpload
            ? `Auto Upload generates ${fmt(autoUpload.uploaded)} videos with 0 published.`
            : ""}
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
        <select
          value={filterChan}
          onChange={(e) => setFilterChan(e.target.value)}
          className={styles.selectInput}
          style={{ marginBottom: 0, flex: "0 0 auto" }}
        >
          <option value="all">All Channels</option>
          {channels.map((c) => (
            <option key={c.channel} value={c.channel}>
              Channel {c.channel}
            </option>
          ))}
        </select>
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className={styles.selectInput}
          style={{ marginBottom: 0, flex: "0 0 auto" }}
        >
          <option value="all">All Users</option>
          {allUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={styles.mainContent} style={{ height: "auto", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              {[
                { key: "channel", label: "Channel" },
                { key: "user", label: "User" },
                { key: "uploaded", label: "Uploaded" },
                { key: "created", label: "Created" },
                { key: "published", label: "Published" },
                { key: "publish_rate_pct", label: "Pub Rate" },
                { key: "uploaded_hrs", label: "Upload Hrs" },
                { key: "created_hrs", label: "Created Hrs" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    color: sortBy === key ? "var(--theme-primary, #00D2FF)" : "#555",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label.toUpperCase()}{sortIcon(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  No rows match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const rate = r.created > 0 ? (r.published / r.created) * 100 : 0;
                return (
                  <tr
                    key={`${r.channel}-${r.user}`}
                    className={styles.videoCard}
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      cursor: "default",
                    }}
                  >
                    <td style={{ padding: "10px 14px", color: "var(--theme-primary, #00D2FF)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      {r.channel}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#ccc" }}>{r.user}</td>
                    <td style={{ padding: "10px 14px", color: "#aaa", fontFamily: "var(--font-mono)" }}>
                      {fmt(r.uploaded || 0)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#aaa", fontFamily: "var(--font-mono)" }}>
                      {fmt(r.created || 0)}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: r.published > 0 ? 700 : 400,
                        color: r.published > 0 ? "#6BCB77" : "#333",
                      }}
                    >
                      {r.published || 0}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: rate > 1 ? "#6BCB77" : "#666" }}>
                      {pct(r.published, r.created)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#555", fontFamily: "var(--font-mono)" }}>
                      {(r.uploaded_hrs || 0).toFixed(1)}h
                    </td>
                    <td style={{ padding: "10px 14px", color: "#555", fontFamily: "var(--font-mono)" }}>
                      {(r.created_hrs || 0).toFixed(1)}h
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div
          style={{
            padding: "10px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 11,
            color: "#444",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Showing {filtered.length} of {(channelUsers || []).length} rows
            {" "}(Channel × User breakdown)
          </span>
          <span style={{ color: "#555" }}>Click column headers to sort</span>
        </div>
      </div>
    </div>
  );
}
