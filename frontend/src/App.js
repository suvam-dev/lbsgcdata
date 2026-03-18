import { useState, useEffect } from "react";
import { DataProvider } from "./context/DataContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import ExecSummary from "./pages/ExecSummary";
import UsageTrends from "./pages/UsageTrends";
import ChannelAnalysis from "./pages/ChannelAnalysis";
import TypeMixFunnel from "./pages/TypeMixFunnel";
import VideoExplorer from "./pages/VideoExplorer";
import NLQInterface from "./pages/NLQInterface";
import ErrorBoundary from "./components/ErrorBoundary";
import styles from "./App.module.css";
import "./index.css";

const TABS = [
  { id: "exec", label: "Executive Summary", icon: "📊" },
  { id: "trends", label: "Usage & Trends", icon: "📈" },
  { id: "channels", label: "Channel Analysis", icon: "📡" },
  { id: "types", label: "Type Mix & Funnel", icon: "🔀" },
  { id: "explorer", label: "Video Explorer", icon: "🎬" },
  { id: "nlq", label: "Ask the Data", icon: "✨" },
];

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const { isDark, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState("exec");
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("client_1");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/clients")
      .then(r => r.json())
      .then(data => {
        if (data.clients && data.clients.length > 0) {
          setClients(data.clients);
          setClientId(prev => data.clients.includes(prev) ? prev : data.clients[0]);
        }
      })
      .catch(() => setClients(["client_1"]));
  }, []);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMenuOpen(false);
  };

  const renderPage = () => {
    switch (activeTab) {
      case "exec": return <ExecSummary />;
      case "trends": return <UsageTrends />;
      case "channels": return <ChannelAnalysis />;
      case "types": return <TypeMixFunnel />;
      case "explorer": return <VideoExplorer />;
      case "nlq": return <NLQInterface />;
      default: return <ExecSummary />;
    }
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>F</div>
            <div>
              <div className={styles.logoTitle}>Frammer AI</div>
              <div className={styles.logoSubtitle}>{clientId.replace("_", " ")}</div>
            </div>
          </div>

          <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`${styles.navBtn} ${activeTab === tab.id ? styles.navBtnActive : ""}`}
              >
                <span className={styles.navIcon}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {menuOpen && <div className={styles.mobileOverlay} onClick={() => setMenuOpen(false)} />}

          <div className={styles.controls}>
            {clients.length > 1 && (
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className={styles.clientSelect}
              >
                {clients.map(c => (
                  <option key={c} value={c}>{c.replace("_", " ").toUpperCase()}</option>
                ))}
              </select>
            )}
            <div className={styles.version}>v1.0</div>
            <button
              className={styles.themeToggle}
              onClick={toggle}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? "☀" : "☾"}
            </button>
            <button className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <ErrorBoundary>
          <DataProvider clientId={clientId}>
            {renderPage()}
          </DataProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
}