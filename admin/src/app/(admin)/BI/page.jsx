"use client";
// ============================================================
// FILE: admin/src/pages/AIAnalytics.jsx
//   OR: admin/src/pages/AIAnalytics/index.jsx
// ============================================================
// Add to your admin router like:
//   <Route path="/ai-analytics" element={<AIAnalytics />} />
// And add a tab link in your sidebar/navbar alongside
//   Restaurants, Orders, etc.
// ============================================================
import { useState, useRef, useEffect } from "react";

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
        <div style={styles.avatar}>
          <span style={{ fontSize: 16 }}>🤖</span>
        </div>
      )}
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.aiBubble),
        }}
      >
        <p style={styles.bubbleText}>{msg.text}</p>
        <span style={styles.timestamp}>{msg.time}</span>
      </div>
      {isUser && (
        <div style={{ ...styles.avatar, background: "#4f46e5" }}>
          <span style={{ fontSize: 14 }}>👤</span>
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
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  async function sendQuery(query) {
    const q = (query || input).trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q, time: now() }]);
    setLoading(true);

    try {
      // const res = await fetch("/api/ai/query", {
      //  const res = await fetch("http://localhost:5010/api/ai/query", { 
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({ query: q }),
      // });

      const res = await fetch("http://localhost:5010/api/ai/query", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  },
  credentials: "include",
  body: JSON.stringify({ query: q }),
});

      const data = await res.json();
      const reply = data.response || data.error || "No response received.";
      setMessages((prev) => [...prev, { role: "ai", text: reply, time: now() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Could not reach the AI service. Check your server.", time: now() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* ── Header ─────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>🤖</div>
          <div>
            <h1 style={styles.headerTitle}>AI Analytics Assistant</h1>
            <p style={styles.headerSub}>Powered by Qwen 2.5 · Tool-Augmented Intelligence</p>
          </div>
        </div>
        <div style={styles.statusBadge}>
          <span style={styles.statusDot} />
          Online
        </div>
      </div>

      <div style={styles.body}>
        {/* ── Suggestions ────────────────────────────── */}
        <div style={styles.suggestions}>
          <p style={styles.suggestLabel}>Try asking:</p>
          <div style={styles.chips}>
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                style={styles.chip}
                onClick={() => sendQuery(q)}
                onMouseEnter={(e) => (e.target.style.background = "#4f46e5", e.target.style.color = "#fff")}
                onMouseLeave={(e) => (e.target.style.background = "#f1f5f9", e.target.style.color = "#475569")}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat window ────────────────────────────── */}
        <div style={styles.chatWindow}>
          <div style={styles.messages}>
            {messages.map((m, i) => (
              <Message key={i} msg={m} />
            ))}
            {loading && (
              <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
                <div style={styles.avatar}>🤖</div>
                <TypingIndicator />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input bar ──────────────────────────────── */}
          <div style={styles.inputBar}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendQuery()}
              placeholder="Ask about revenue, restaurants, users, orders..."
              disabled={loading}
            />
            <button
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.5 : 1,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              }}
              onClick={() => sendQuery()}
              disabled={loading || !input.trim()}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)",
    padding: "24px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 20px rgba(79,70,229,0.3)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    fontSize: 36,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    width: 60,
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.3px",
  },
  headerSub: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },
  statusBadge: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 20,
    padding: "6px 14px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#4ade80",
    display: "inline-block",
    boxShadow: "0 0 6px #4ade80",
  },
  body: {
    flex: 1,
    maxWidth: 900,
    width: "100%",
    margin: "0 auto",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  suggestions: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px 20px",
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  suggestLabel: {
    margin: "0 0 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "7px 14px",
    fontSize: 13,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    fontFamily: "inherit",
  },
  chatWindow: {
    flex: 1,
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 500,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "2px solid #e2e8f0",
  },
  bubble: {
    maxWidth: "72%",
    borderRadius: 18,
    padding: "12px 16px",
    position: "relative",
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
    margin: "0 0 4px",
    fontSize: 14.5,
    lineHeight: 1.6,
    color: "inherit",
    whiteSpace: "pre-wrap",
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.5,
    display: "block",
    textAlign: "right",
  },
  typingBubble: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: "14px 18px",
    display: "flex",
    gap: 5,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#94a3b8",
    display: "inline-block",
    animation: "bounce 1s infinite",
  },
  inputBar: {
    borderTop: "1px solid #e2e8f0",
    padding: "16px 20px",
    display: "flex",
    gap: 12,
    background: "#fff",
  },
  input: {
    flex: 1,
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    padding: "11px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
    color: "#1e293b",
    background: "#f8fafc",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "11px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
    fontFamily: "inherit",
    letterSpacing: "0.3px",
  },
};

// Inject bounce keyframes once
if (typeof document !== "undefined" && !document.getElementById("ai-bounce-style")) {
  const style = document.createElement("style");
  style.id = "ai-bounce-style";
  style.textContent = `
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
  `;
  document.head.appendChild(style);
}
