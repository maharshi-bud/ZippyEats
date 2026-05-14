"use client";

// ============================================================
// FILE: admin/src/app/(admin)/queries/page.tsx
// ============================================================

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import AdminSupportPanel from "../../../components/support/AdminSupportPanel";

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5010";

const PRIORITY_COLORS = {
  urgent: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  high: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  medium: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  low: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
};

const STATUS_COLORS = {
  open: { bg: "#eff6ff", text: "#2563eb" },
  pending: { bg: "#fff7ed", text: "#ea580c" },
  active: { bg: "#f0fdf4", text: "#16a34a" },
  resolved: { bg: "#f1f5f9", text: "#64748b" },
};

const CATEGORY_LABELS = {
  payment_issue: "💳 Payment",
  missing_items: "📦 Missing Items",
  wrong_order: "❌ Wrong Order",
  order_not_received: "🚫 Not Received",
  refund_issue: "💰 Refund",
  delivery_issue: "🛵 Delivery",
  other: "💬 Other",
};

function ElapsedTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const str = h > 0
    ? `${h}h ${m}m`
    : m > 0
    ? `${m}m ${s}s`
    : `${s}s`;

  const isUrgent = elapsed > 300;
  return (
    <span style={{ color: isUrgent ? "#dc2626" : "#64748b", fontSize: 12, fontWeight: 500 }}>
      ⏱ {str}
    </span>
  );
}

function TicketCard({ ticket, onOpen, onStatusChange }) {
  const priority = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium;
  const status = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;

  return (
    <div style={s.card}>
      {/* Top Row */}
      <div style={s.cardTop}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...s.badge, background: priority.bg, color: priority.text, border: `1px solid ${priority.border}` }}>
            {ticket.priority?.toUpperCase()}
          </span>
          <span style={{ ...s.badge, background: status.bg, color: status.text }}>
            {ticket.status?.toUpperCase()}
          </span>
        </div>
        <ElapsedTimer createdAt={ticket.createdAt} />
      </div>

      {/* Info */}
      <div style={s.cardMid}>
        <div style={s.ticketId}>{ticket.ticketId}</div>
        <div style={s.userName}>{ticket.userId?.name || "Unknown User"}</div>
        <div style={s.category}>{CATEGORY_LABELS[ticket.category] || ticket.category}</div>
        {ticket.description && (
          <div style={s.desc}>
            {ticket.description.slice(0, 80)}{ticket.description.length > 80 ? "..." : ""}
          </div>
        )}
        <div style={s.orderId}>Order: #{ticket.orderId?._id?.toString().slice(-6).toUpperCase()}</div>
      </div>

      {/* Actions */}
      <div style={s.cardActions}>
        <button style={s.primaryBtn} onClick={() => onOpen(ticket)}>
          Open Ticket
        </button>
        {ticket.status === "open" && (
          <button style={s.secondaryBtn} onClick={() => onStatusChange(ticket._id, "pending")}>
            Pending
          </button>
        )}
        {ticket.status !== "resolved" && (
          <button style={s.dangerBtn} onClick={() => onStatusChange(ticket._id, "resolved")}>
            Resolve
          </button>
        )}
      </div>

      {/* Unread badge */}
      {ticket.unreadAdmin > 0 && (
        <div style={s.unreadBadge}>{ticket.unreadAdmin}</div>
      )}
    </div>
  );
}

export default function QueriesPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [closedOpen, setClosedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const token = typeof window !== "undefined"
    ? localStorage.getItem("token") || localStorage.getItem("adminToken") || ""
    : "";

  // ── Fetch tickets ────────────────────────────────────────
  async function fetchTickets() {
    try {
      const res = await fetch(`${SERVER}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Queries] fetchTickets error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Socket setup ─────────────────────────────────────────
  useEffect(() => {
    fetchTickets();

    socketRef.current = io(SERVER, { auth: { token } });
    socketRef.current.emit("admin:join_support");

    socketRef.current.on("ticket:new", (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      // Sound notification
      try { new Audio("/sounds/notify.mp3").play(); } catch {}
    });

    socketRef.current.on("ticket:updated", (updated) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
      if (selectedTicket?._id === updated._id) {
        setSelectedTicket(updated);
      }
    });

    socketRef.current.on("ticket:message", ({ ticketId }) => {
      setTickets((prev) =>
        prev.map((t) =>
          t._id === ticketId
            ? { ...t, unreadAdmin: (t.unreadAdmin || 0) + 1 }
            : t
        )
      );
    });

    return () => socketRef.current?.disconnect();
  }, []);

  // ── Status change ────────────────────────────────────────
  async function handleStatusChange(ticketId, status) {
    try {
      await fetch(`${SERVER}/api/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("[Queries] statusChange error:", err);
    }
  }

  // ── Open ticket (join + set active) ─────────────────────
  async function handleOpenTicket(ticket) {
    setSelectedTicket(ticket);
    socketRef.current.emit("support:join", ticket._id);
    if (ticket.status === "open") {
      await handleStatusChange(ticket._id, "active");
    }
    // Mark read
    setTickets((prev) =>
      prev.map((t) => (t._id === ticket._id ? { ...t, unreadAdmin: 0 } : t))
    );
  }

  const openTickets = tickets.filter((t) => t.status !== "resolved");
  const closedTickets = tickets.filter((t) => t.status === "resolved");
  const openCount = openTickets.length;

  if (selectedTicket) {
    return (
      <AdminSupportPanel
        ticket={selectedTicket}
        token={token}
        socket={socketRef.current}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Support Queries</h1>
          <p style={s.pageSub}>Manage customer support tickets in real time</p>
        </div>
        <div style={s.statsRow}>
          <div style={s.statBox}>
            <span style={s.statNum}>{openCount}</span>
            <span style={s.statLabel}>Open</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>{tickets.filter((t) => t.status === "active").length}</span>
            <span style={s.statLabel}>Active</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>{closedTickets.length}</span>
            <span style={s.statLabel}>Resolved</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={s.loading}>Loading tickets...</div>
      ) : (
        <>
          {/* Open Tickets */}
          <div style={s.section}>
            <h2 style={s.sectionTitle}>
              🔴 Open Tickets
              {openCount > 0 && <span style={s.countBadge}>{openCount}</span>}
            </h2>
            {openTickets.length === 0 ? (
              <div style={s.empty}>No open tickets 🎉</div>
            ) : (
              <div style={s.grid}>
                {openTickets.map((t) => (
                  <TicketCard
                    key={t._id}
                    ticket={t}
                    onOpen={handleOpenTicket}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Closed Tickets */}
          <div style={s.section}>
            <button
              style={s.collapseBtn}
              onClick={() => setClosedOpen(!closedOpen)}
            >
              {closedOpen ? "▼" : "▶"} Resolved Tickets ({closedTickets.length})
            </button>
            {closedOpen && (
              <div style={s.grid}>
                {closedTickets.map((t) => (
                  <TicketCard
                    key={t._id}
                    ticket={t}
                    onOpen={handleOpenTicket}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  page: { padding: "28px 32px", background: "#f8fafc", minHeight: "100vh" },
  pageHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 28,
  },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" },
  pageSub: { margin: "4px 0 0", fontSize: 13, color: "#94a3b8" },
  statsRow: { display: "flex", gap: 12 },
  statBox: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "10px 20px", textAlign: "center", minWidth: 70,
  },
  statNum: { display: "block", fontSize: 22, fontWeight: 700, color: "#0f172a" },
  statLabel: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 16,
    display: "flex", alignItems: "center", gap: 8,
  },
  countBadge: {
    background: "#ef4444", color: "#fff", borderRadius: 20,
    padding: "1px 8px", fontSize: 12, fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
    padding: "16px", position: "relative",
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  badge: { borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 },
  cardMid: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 },
  ticketId: { fontSize: 13, fontWeight: 700, color: "#4f46e5" },
  userName: { fontSize: 15, fontWeight: 600, color: "#0f172a" },
  category: { fontSize: 13, color: "#64748b" },
  desc: { fontSize: 13, color: "#94a3b8", fontStyle: "italic" },
  orderId: { fontSize: 12, color: "#cbd5e1" },
  cardActions: { display: "flex", gap: 8 },
  primaryBtn: {
    flex: 1, background: "#4f46e5", color: "#fff", border: "none",
    borderRadius: 8, padding: "8px 0", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  secondaryBtn: {
    background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0",
    borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer",
  },
  dangerBtn: {
    background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
    borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer",
  },
  unreadBadge: {
    position: "absolute", top: 12, right: 12,
    background: "#ef4444", color: "#fff", borderRadius: "50%",
    width: 20, height: 20, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 11, fontWeight: 700,
  },
  collapseBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 16, padding: 0,
  },
  empty: { color: "#94a3b8", fontSize: 14, padding: "20px 0" },
  loading: { color: "#94a3b8", fontSize: 14, padding: "40px 0", textAlign: "center" },
};