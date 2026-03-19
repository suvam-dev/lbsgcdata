import { useState, useRef, useEffect } from "react";
import { useData } from "../context/DataContext";
import { queryNLQ, queryNLQLocal } from "../api/groq";
import styles from "./NLQInterface.module.css";

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const SUGGESTIONS = [
  "What is my best performing channel?",
  "Why is my publish rate so low?",
  "Which output type should I focus on?",
  "How am I doing on YouTube vs TikTok?"
];

export default function NLQInterface() {
  const { summary, monthly, channels, outputTypes, inputTypes } = useData();
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState([]);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const scrollRef = useRef(null);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, loadingMsg]);

  const handleSend = async (overrideQuery) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;

    setChat(prev => [...prev, { role: "user", text: q }]);
    setQuery("");
    setLoadingMsg(true);

    try {
      const dataPayload = { summary, monthly, channels, outputTypes, inputTypes };
      let replyText = "";
      
      if (!apiKey) {
        replyText = queryNLQLocal(q, dataPayload);
      } else {
        replyText = await queryNLQ(q, dataPayload, apiKey);
      }
      
      setChat(prev => [...prev, { role: "system", text: replyText }]);
    } catch (err) {
      setChat(prev => [...prev, { role: "error", text: "Failed to connect to the analysis engine: " + err.message }]);
    } finally {
      setLoadingMsg(false);
    }
  };

  return (
    <div className={styles.container}>      {!apiKey && (
        <div className={styles.warningBanner}>
          ⚠️ REACT_APP_GROQ_API_KEY is missing. Using limited local fallback logic. AI responses disabled.
        </div>
      )}

      <div className={styles.chatArea} ref={scrollRef}>
        {chat.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✦</div>
            <div className={styles.emptyTitle}>Ask Frammer AI</div>
            <div className={styles.emptySub}>Ask natural language questions about your video production pipeline.</div>
            
            <div className={styles.pillContainer}>
              {SUGGESTIONS.map((s, i) => (
                <div key={i} className={styles.suggestionPill} onClick={() => handleSend(s)}>
                  "{s}"
                </div>
              ))}
            </div>
          </div>
        ) : (
          chat.map((msg, i) => (
            <div key={i} className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowUser : styles.messageRowSystem}`}>
              <div className={`${styles.messageBubble} ${
                msg.role === 'user' ? styles.messageBubbleUser : 
                msg.role === 'error' ? styles.messageBubbleError : 
                styles.messageBubbleSystem
              }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        
        {loadingMsg && (
          <div className={`${styles.messageRow} ${styles.messageRowSystem}`}>
            <div className={`${styles.messageBubble} ${styles.messageBubbleSystem}`} style={{opacity: 0.5}}>
              Analyzing data pipeline...
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className={styles.inputForm}>
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="E.g. What is my best input type for Shorts?"
            disabled={loadingMsg}
            className={styles.inputField}
          />
          <button type="submit" disabled={!query.trim() || loadingMsg} className={styles.sendBtn}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
