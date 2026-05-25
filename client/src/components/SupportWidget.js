"use client";
// ============================================================
// FILE: client/src/components/support/SupportWidget.js
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5010";

const CATEGORIES = [
  { key: "payment_issue", label: "💳 Payment issue" },
  { key: "missing_items", label: "📦 Missing items" },
  { key: "wrong_order", label: "❌ Wrong order" },
  { key: "order_not_received", label: "🚫 Order not received" },
  { key: "refund_issue", label: "💰 Refund issue" },
  { key: "delivery_issue", label: "🛵 Delivery issue" },
  { key: "other", label: "💬 Other" },
];

export default function SupportWidget({ orderId, userId, token }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("home");
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
      const isResolved =
  ticket?.status === "resolved" ||
  ticket?.status === "refund_completed";
  const socketRef = useRef(null);
  const ticketRef = useRef(null);
  const bottomRef = useRef(null);
  const timerRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function appendMessage(msg) {
    if (!msg) return;
    setMessages((prev) => {
      const id = msg._id?.toString();
      if (id && prev.some((m) => m._id?.toString() === id)) return prev;
      if (msg.senderType === "user") {
        const optimisticIndex = prev.findIndex(
          (m) => m._optimistic && m.senderType === "user" && m.message === msg.message
        );
        if (optimisticIndex !== -1) {
          return prev.map((m, i) => (i === optimisticIndex ? msg : m));
        }
      }
      return [...prev, msg];
    });
  }

  useEffect(() => {
    ticketRef.current = ticket;
  }, [ticket]);

  // ── Connect socket ──────────────────────────────────────
  useEffect(() => {
    if (!token || !userId) return;

    socketRef.current = io(SERVER, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("[SupportWidget] Socket connected");
      // ✅ FIX: Join personal user room using SAME event as main socket.js
      socketRef.current.emit("join", { userId, role: "user" });
      if (ticketRef.current?._id) {
        socketRef.current.emit("support:join", ticketRef.current._id);
      }
    });

    // ✅ FIX: Listen for admin joining — this triggers chat open
    socketRef.current.on("ticket:status", ({ ticketId, status, message }) => {
      console.log("[SupportWidget] ticket:status received", status);
      if (status === "active") {
        setStep("chat");
        setMessages((prev) => [
          ...prev,
          { senderType: "system", message: message || "Support staff joined the chat", createdAt: new Date() },
        ]);
      }
    });

    // ✅ FIX: Only add message if it's NOT from us (avoid duplicate with optimistic)
    socketRef.current.on("message:new", (msg) => {
      appendMessage(msg);
      if (msg.senderType !== "user") {
        setStep("chat");
        setOpen(true);
      }

      setTyping(false);
    });



// // ✅ FIX: Only add message if it's NOT from us (avoid duplicate with optimistic)
//     socketRef.current.on("message:new", (msg) => {
//       if (msg.senderType !== "user") {
//         appendMessage(msg);
//       }
//       setTyping(false);
//     });



    socketRef.current.on("ticket:refund", ({ ticketId, ticket: updatedTicket, message }) => {
      if (updatedTicket) setTicket(updatedTicket);
      if (ticketId) socketRef.current?.emit("support:join", ticketId);
      appendMessage(message);
      setStep("chat");
      setOpen(true);
      setTyping(false);
    });

    socketRef.current.on("support:typing", ({ senderType }) => {
      if (senderType === "admin") setTyping(true);
    });

    socketRef.current.on("support:stop_typing", ({ senderType }) => {
      if (senderType === "admin") setTyping(false);
    });

   socketRef.current.on(
  "ticket:resolved",
  ({
    ticketId,
    resolutionSummary,
    resolutionType,
  }) => {

    setTicket((prev) => {

      if (!prev) return prev;

      if (
        prev._id?.toString() !==
        ticketId?.toString()
      ) {
        return prev;
      }

      return {
        ...prev,

        status: "resolved",

        resolutionSummary,

        resolutionType,

        resolvedAt:
          new Date().toISOString(),
      };
    });

    appendMessage({
      _id: `resolved-${Date.now()}`,

      senderType: "system",

      message:
        `✅ Ticket resolved: ${resolutionSummary}`,

      createdAt:
        new Date().toISOString(),
    });

    setTyping(false);
  }
); 

// socketRef.current.on("ticket:resolved", ({ resolutionSummary }) => {
//       setMessages((prev) => [
//         ...prev,
//         {
//           senderType: "system",
//           message: `✅ Ticket resolved: ${resolutionSummary}`,
//           createdAt: new Date(),
//         },
//       ]);
//     });

    socketRef.current.on("connect_error", (err) => {
      console.error("[SupportWidget] Socket error:", err.message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId, token]);

  useEffect(() => {
    if (!token || !orderId) return;

    async function loadExistingTicket() {
      try {
        const res = await fetch(`${SERVER}/api/support/tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tickets = await res.json();
        if (!Array.isArray(tickets)) return;

       const existing = tickets.find((t) => {

  const ticketOrderId =
    t.orderId?._id || t.orderId;

  return (
    ticketOrderId?.toString() ===
      orderId?.toString() &&
    ![
      "resolved",
      "refund_completed",
    ].includes(t.status)
  );
});
        if (!existing) return;

        setTicket(existing);
        setStep(existing.status === "active" ? "chat" : "waiting");

        const msgRes = await fetch(
          `${SERVER}/api/support/tickets/${existing._id}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const msgs = await msgRes.json();
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (err) {
        console.error("[SupportWidget] loadExistingTicket error:", err);
      }
    }

    loadExistingTicket();
  }, [orderId, token]);

  useEffect(() => {
    if (!ticket?._id || !socketRef.current?.connected) return;
    socketRef.current.emit("support:join", ticket._id);
  }, [ticket?._id]);

  // ── Auto scroll ─────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ── Wait timer ──────────────────────────────────────────
useEffect(() => {

  if (
    step === "waiting" &&
    !isResolved
  ) {

    timerRef.current = setInterval(
      () => {
        setWaitTime((t) => t + 1);
      },
      1000
    );
  }

  return () => {
    clearInterval(timerRef.current);
  };

}, [step, isResolved]);

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  // ── Create ticket ────────────────────────────────────────
  async function createTicket(cat) {
  setStep("waiting");
  try {
    const res = await fetch(`${SERVER}/api/support/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId, category: cat, description: "" }),
    });
    const data = await res.json();
    if (!data._id) {
      console.error("[SupportWidget] Ticket creation failed:", data);
      return;
    }
    setTicket(data);

    // ✅ FIX: Wait for socket to be ready before joining room
    const joinRoom = () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("support:join", data._id);
      } else {
        // Retry after 500ms if not connected yet
        setTimeout(joinRoom, 500);
      }
    };
    joinRoom();

    // Load existing messages
    const msgRes = await fetch(
      `${SERVER}/api/support/tickets/${data._id}/messages`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const msgs = await msgRes.json();
    setMessages(Array.isArray(msgs) ? msgs : []);
  } catch (err) {
    console.error("[SupportWidget] createTicket error:", err);
  }
}

  // ── Send message ─────────────────────────────────────────
async function sendMessage() {

  if (!input.trim() || !ticket) return;

  if (
    ticket.status === "resolved" ||
    ticket.status === "refund_completed"
  ) {
    return;
  }
  const text = input.trim();
  
  setInput("");
  
  clearTimeout(typingTimer.current);
  
  socketRef.current?.emit(
    "support:stop_typing",
    {
      ticketId: ticket._id,
      senderType: "user",
    }
  );
  
  try {
    
    // appendMessage("hi");
    const res = await fetch(
      `${SERVER}/api/support/tickets/${ticket._id}/message`,
      {
        method: "POST",
        
        headers: {
          "Content-Type":
          "application/json",
          
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          message: text,
        }),
      }
    );
    
    if (!res.ok) {
      
      const err = await res.json();
      
      console.error(
        "[SupportWidget] send failed:",
        err
      );
    }
    
  } catch (err) {
    
    console.error(
      "[SupportWidget] sendMessage error:",
      err
    );
  }
}

function handleInputChange(e) {
  setInput(e.target.value);
  if (ticket && socketRef.current) {
      socketRef.current.emit("support:typing", {
        ticketId: ticket._id,
        senderType: "user",
      });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socketRef.current?.emit("support:stop_typing", {
          ticketId: ticket._id,
          senderType: "user",
        });
      }, 1500);
    }
  }
  
  const widgetContent = (
    <>
      {/* ── Trigger Button ── */}
      <button onClick={() => setOpen(!open)} style={s.trigger}>
        {open ? "✕" : "💬 Need Help?"}
      </button>

      {/* ── Widget ── */}
      {open && (
        <div style={s.widget}>
          {/* Header */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.headerIcon}>🛵</div>
              <div>
                <div style={s.headerTitle}>ZippyEats Support</div>
                <div style={s.headerSub}>
                  {step === "waiting" ? "⏳ Waiting for agent..." : "● Online"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={s.closeBtn}>✕</button>
          </div>

          {/* ── HOME ── */}
          {step === "home" && (
            <div style={s.body}>
              <p style={s.bodyTitle}>How can we help you?</p>
              {[
                { label: "📍 Where is my order?", action: () => createTicket("delivery_issue") },
                { label: "⏱ How long will it take?", action: () => createTicket("delivery_issue") },
                { label: "🔧 Other issue", action: () => setStep("category") },
              ].map((opt) => (
                <button key={opt.label} style={s.optBtn} onClick={opt.action}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* ── CATEGORY ── */}
          {step === "category" && (
            <div style={s.body}>
              <p style={s.bodyTitle}>Select issue type:</p>
              {CATEGORIES.map((cat) => (
                <button key={cat.key} style={s.optBtn} onClick={() => createTicket(cat.key)}>
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* ── WAITING ── */}
          {step === "waiting" && (
            <div style={{ ...s.body, alignItems: "center", textAlign: "center" }}>
              <div style={s.spinner} />
              <p style={{ fontWeight: 600, color: "#1e293b", margin: "12px 0 4px" }}>
                Waiting for support staff...
              </p>
              <p style={{ color: "#94a3b8", fontSize: 13 }}>We'll connect you shortly</p>
              <div style={s.timerBox}>
                ⏱ Wait time: <strong>{formatTime(waitTime)}</strong>
              </div>
              {ticket && (
                <div style={s.ticketIdBox}>
                  Ticket ID: <strong>{ticket.ticketId}</strong>
                </div>
              )}
            </div>
          )}

          {/* ── CHAT ── */}
          {step === "chat" && (
            <>
              <div style={s.messages}>
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      ...s.msgRow,
                      justifyContent:
                        m.senderType === "user"
                          ? "flex-end"
                          : m.senderType === "system"
                          ? "center"
                          : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        ...s.bubble,
                        ...(m.senderType === "user"
                          ? s.userBubble
                          : m.senderType === "system"
                          ? s.systemBubble
                          : s.adminBubble),
                      }}
                    >
                      {m.senderType === "admin" && (
                        <div style={s.senderLabel}>Support Agent</div>
                      )}
                      <p style={s.bubbleText}>{m.message}</p>
                      <span style={s.timestamp}>
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                    <div style={{ ...s.bubble, ...s.adminBubble }}>
                      <span style={s.typingDots}>Agent is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              
              <div style={s.inputBar}>
                <input
                  style={s.input}
                  value={input}
                    disabled={isResolved}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={
    isResolved
      ? "Ticket closed"
      : "Type a message..."
  }
                />
                {/* <button   disabled={isResolved} style={s.sendBtn} onClick={sendMessage}>➤</button> */}
                <button
  disabled={isResolved}
  style={{
    ...s.sendBtn,
    opacity: isResolved ? 0.5 : 1,
    cursor: isResolved
      ? "not-allowed"
      : "pointer",
  }}
  onClick={sendMessage}
>
  ➤
</button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );

  return mounted ? createPortal(widgetContent, document.body) : null;
}


const s = {
  trigger: {
    position: "fixed", bottom: 24, right: 24,
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "#fff", border: "none", borderRadius: 24,
    padding: "12px 20px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", boxShadow: "0 4px 20px rgba(79,70,229,0.4)", zIndex: 9999,
  },
  widget: {
    position: "fixed", bottom: 80, right: 24, width: 360, maxHeight: 560,
    background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    zIndex: 9999, border: "1px solid #e2e8f0",
  },
  header: {
    background: "linear-gradient(135deg, #1e1b4b, #4f46e5)",
    padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(255,255,255,0.2)", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 18,
  },
  headerTitle: { color: "#fff", fontWeight: 600, fontSize: 14 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  closeBtn: {
    background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
    borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 13,
  },
  body: { padding: "16px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1 },
  bodyTitle: { fontSize: 13, fontWeight: 600, color: "#64748b", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" },
  optBtn: {
    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, cursor: "pointer",
    textAlign: "left", color: "#1e293b", fontWeight: 500,
  },
  spinner: {
    width: 40, height: 40, border: "3px solid #e2e8f0",
    borderTop: "3px solid #4f46e5", borderRadius: "50%",
    animation: "spin 1s linear infinite", marginTop: 16,
  },
  timerBox: { marginTop: 12, background: "#f1f5f9", borderRadius: 10, padding: "8px 16px", fontSize: 14, color: "#475569" },
  ticketIdBox: { marginTop: 8, background: "#ede9fe", borderRadius: 10, padding: "7px 14px", fontSize: 13, color: "#4f46e5" },
  messages: { flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10, maxHeight: 380 },
  msgRow: { display: "flex" },
  bubble: { maxWidth: "80%", borderRadius: 14, padding: "9px 12px" },
  userBubble: { background: "linear-gradient(135deg, #4f46e5, #6366f1)", borderBottomRightRadius: 3 },
  adminBubble: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderBottomLeftRadius: 3 },
  systemBubble: { background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, margin: "0 auto", maxWidth: "90%" },
  senderLabel: { fontSize: 10, color: "#94a3b8", marginBottom: 2, fontWeight: 600 },
  bubbleText: { margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "inherit", whiteSpace: "pre-wrap" },
  timestamp: { fontSize: 10, opacity: 0.5, display: "block", textAlign: "right", marginTop: 2 },
  typingDots: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
  inputBar: { borderTop: "1px solid #f1f5f9", padding: "10px 12px", display: "flex", gap: 8 },
  input: { flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 13.5, outline: "none", color: "#1e293b" },
  sendBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: 16 },
};
