"use client";

import { useState, useRef, useEffect } from "react";
import PermissionGuard from "../../../components/PermissionGuard";
const SUGGESTED_QUERIES = [
  "How is revenue looking this month?",
  "Which restaurants are underperforming?",
  "What are the peak order hours this week?",
  "Show me the top 5 restaurants by revenue",
  "What's the cancellation rate this month?",
  "How is user growth trending?",
];

function TypingIndicator() {
  return (
    <div style={styles.typingBubble}>
      <span style={{ ...styles.dot, animationDelay: "0s" }} />
      <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
      <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ ...styles.msgRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={styles.avatarAi}>
          <span style={{ fontSize: 15 }}>🤖</span>
        </div>
      )}
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.aiBubble) }}>
        <p style={{ ...styles.bubbleText, color: isUser ? "#fff" : "#1e293b" }}>{msg.text}</p>
        <span style={{ ...styles.timestamp, color: isUser ? "rgba(255,255,255,0.6)" : "#94a3b8" }}>
          {msg.time}
        </span>
      </div>
      {isUser && (
        <div style={styles.avatarUser}>
          <span style={{ fontSize: 13 }}>👤</span>
        </div>
      )}
    </div>
  );
}

export default function AIAnalytics() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I'm your AI analytics assistant. Ask me anything about your platform — revenue, restaurants, users, orders, and more.",
      time: getTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function getTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  async function sendQuery(query) {
    const q = (query || input).trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q, time: getTime() }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken") || "";
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010";
      const res = await fetch(`${API_BASE}/api/ai/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      const reply = data.response || data.error || "No response received.";
      setMessages((prev) => [...prev, { role: "ai", text: reply, time: getTime() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Could not reach the AI service. Check your server.", time: getTime() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
            <PermissionGuard resource="bi" operation="view">

    <div style={styles.page}>

      {/* ── Page Title ── */}
      <div style={styles.pageHeader}>
        <div style={styles.pageHeaderLeft}>
          <div style={styles.iconBox}>🤖</div>
          <div>
            <h1 style={styles.pageTitle}>AI Analytics Assistant</h1>
            <p style={styles.pageSubtitle}>Tool-augmented intelligence · Powered by OpenRouter</p>
          </div>
        </div>
        <div style={styles.onlineBadge}>
          <span style={styles.onlineDot} />
          Online
        </div>
      </div>

      {/* ── Suggestion Chips ── */}
      <div style={styles.chipsRow}>
        {SUGGESTED_QUERIES.map((q) => (
          <button
            key={q}
            style={styles.chip}
            onClick={() => sendQuery(q)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "#4f46e5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#475569";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── Chat Window ── */}
      <div style={styles.chatCard}>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((m, i) => (
            <Message key={i} msg={m} />
          ))}
          {loading && (
            <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
              <div style={styles.avatarAi}>🤖</div>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputBar}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendQuery()}
            placeholder="Ask about revenue, restaurants, users, orders..."
            disabled={loading}
            onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: loading || !input.trim() ? 0.45 : 1,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}
            onClick={() => sendQuery()}
            disabled={loading || !input.trim()}
          >
            {loading ? "···" : "Send →"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
    </PermissionGuard>
  );
}

const styles = {
  page: {
    // padding: "28px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    // height: "60vh",
      height: "100%",

    boxSizing: "border-box",
    background: "#f8fafc00",
    minHeight: "0vh",
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
  },
  pageTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.3px",
  },
  pageSubtitle: {
    margin: "2px 0 0",
    fontSize: 12.5,
    color: "#94a3b8",
  },
  onlineBadge: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#16a34a",
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-block",
    boxShadow: "0 0 5px #22c55e",
  },
  chipsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12.5,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
    fontWeight: 500,
  },
  chatCard: {
    flex: 1,
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 400,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 9,
  },
  avatarAi: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#ede9fe",
    border: "1px solid #ddd6fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 14,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 13,
  },
  bubble: {
    maxWidth: "70%",
    borderRadius: 16,
    padding: "10px 14px",
  },
  userBubble: {
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    margin: "0 0 3px",
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  timestamp: {
    fontSize: 10.5,
    display: "block",
    textAlign: "right",
  },
  typingBubble: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: "12px 16px",
    display: "flex",
    gap: 5,
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#94a3b8",
    display: "inline-block",
    animation: "bounce 1s infinite",
  },
  inputBar: {
    borderTop: "1px solid #f1f5f9",
    padding: "14px 20px",
    display: "flex",
    gap: 10,
    background: "#fff",
  },
  input: {
    flex: 1,
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    color: "#1e293b",
    background: "#f8fafc",
    transition: "border-color 0.2s",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
    letterSpacing: "0.2px",
  },
};