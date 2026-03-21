import { useState, useRef, useEffect } from "react";
import { useData } from "../context/DataContext";
import { queryNLQ, queryNLQLocal, buildSystemPrompt } from "../api/groq";
import styles from "./NLQInterface.module.css";

const apiKey = process.env.REACT_APP_GROQ_API_KEY;

const QUICK_QUERIES = [
  "Which channels have the biggest publish gaps?",
  "What output type has the best publish rate?",
  "Top users by published videos",
  "How does English vs Hindi compare?",
  "What data quality issues exist?",
];

export default function NLQInterface() {
  const liveData = useData();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your Frammer AI analytics assistant powered by Groq. Ask me anything about your video data — channels, users, publish rates, trends, or data quality.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (q) => {
    const question = q || query;
    if (!question.trim() || loading) return;
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setLoading(true);
    setQuery("");
    try {
      const conversationHistory = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      let content;
      if (apiKey) {
        const systemPrompt = buildSystemPrompt(liveData);
        content = await queryNLQ(conversationHistory, systemPrompt);
      } else {
        content = queryNLQLocal(question);
      }
      setMessages((h) => [...h, { role: "assistant", content }]);
    } catch (e) {
      setMessages((h) => [
        ...h,
        { role: "assistant", content: `Error: ${e.message}` },
      ]);
    }
    setLoading(false);
  };

  const clearChat = () =>
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. What would you like to know about your data?",
      },
    ]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.statusIndicator}>
          {apiKey ? (
            <span className={styles.statusOnline}>● Groq AI · llama-3.3-70b-versatile</span>
          ) : (
            <span className={styles.statusOffline}>● Local mode — add REACT_APP_GROQ_API_KEY to .env</span>
          )}
        </div>
        <button onClick={clearChat} className={styles.clearBtn}>Clear chat</button>
      </div>

      {/* Quick query chips */}
      <div className={styles.pillContainer}>
        {QUICK_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => handleSubmit(q)}
            disabled={loading}
            className={styles.suggestionPill}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat window — avatar bubble style from reference */}
      <div className={styles.chatArea} ref={bottomRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 10,
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                background:
                  msg.role === "user"
                    ? "rgba(139, 92, 246, 0.25)"
                    : "rgba(6, 182, 212, 0.25)",
                color: msg.role === "user" ? "#d8b4fe" : "#67e8f9",
              }}
            >
              {msg.role === "user" ? "U" : "AI"}
            </div>
            {/* Bubble */}
            <div
              style={{
                maxWidth: "76%",
                padding: "10px 16px",
                borderRadius:
                  msg.role === "user"
                    ? "12px 2px 12px 12px"
                    : "2px 12px 12px 12px",
                background:
                  msg.role === "user"
                    ? "rgba(123,97,255,0.12)"
                    : "rgba(0,210,255,0.05)",
                border: `1px solid ${
                  msg.role === "user"
                    ? "rgba(123,97,255,0.2)"
                    : "rgba(0,210,255,0.1)"
                }`,
                fontSize: 13,
                color: msg.role === "user" ? "var(--color-text-primary, #f8fafc)" : "var(--color-text-secondary, #e2e8f0)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading animation */}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
            <div
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(6, 182, 212, 0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#67e8f9", flexShrink: 0,
              }}
            >
              AI
            </div>
            <div
              style={{
                padding: "10px 16px",
                borderRadius: "2px 12px 12px 12px",
                background: "rgba(0,210,255,0.05)",
                border: "1px solid rgba(0,210,255,0.1)",
                color: "var(--color-text-secondary, #e2e8f0)", fontSize: 13,
                display: "flex", gap: 4, alignItems: "center",
              }}
            >
              <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>
              <span style={{ animation: "pulse 1s ease-in-out 0.3s infinite" }}>●</span>
              <span style={{ animation: "pulse 1s ease-in-out 0.6s infinite" }}>●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className={styles.inputArea}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          className={styles.inputForm}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            placeholder="Ask anything about your video analytics..."
            disabled={loading}
            className={styles.inputField}
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className={styles.sendBtn}
          >
            Send →
          </button>
        </form>
      </div>
    </div>
  );
}
