"use client";
import { useState, useEffect, useRef } from "react";
import OrderEditPanel from "./OrderEditPanel";

const SERVER = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010";

const RESOLUTION_TYPES = [
  { key: "refund_issued", label: "💰 Refund Issued" },
  { key: "clarified_issue", label: "💬 Clarified Issue" },
  { key: "reordered_item", label: "🔄 Reordered Item" },
  { key: "delivery_completed", label: "✅ Delivery Completed" },
  { key: "other", label: "📝 Other" },
];

const STATUS_FLOW = ["open", "pending", "active", "resolved"];

export default function AdminSupportPanel({ ticket: initialTicket, token, socket, onBack }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [orderDetails, setOrderDetails] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [resolveForm, setResolveForm] = useState({ summary: "", type: "clarified_issue" });
  const [refundForm, setRefundForm] = useState({ type: "partial", amount: "", reason: "" });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    fetchDetails();
    fetchMessages();

    const handleTicketUpdate = (updated) => {
      setTicket((prev) => {
        if (!prev) return prev;
        if (prev._id?.toString() !== updated._id?.toString()) return prev;
        return updated;
      });
    };

    const appendMessage = (msg) => {
      if (!msg) return;
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m._id?.toString() === msg._id?.toString())) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    socket?.on("message:new", (msg) => {
      appendMessage(msg);
      setTyping(false);
    });
    socket?.on("support:typing", ({ senderType }) => {
      if (senderType === "user") setTyping(true);
    });
    socket?.on("support:stop_typing", ({ senderType }) => {
      if (senderType === "user") setTyping(false);
    });
    socket?.on("ticket:updated", handleTicketUpdate);

    return () => {
      socket?.off("message:new");
      socket?.off("support:typing");
      socket?.off("support:stop_typing");
      socket?.off("ticket:updated", handleTicketUpdate);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function fetchDetails() {
    try {
      const res = await fetch(`${SERVER}/api/support/tickets/${ticket._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrderDetails(data.ticket?.orderId);
      setUserStats(data.userStats);
      setTicket(data.ticket);
    } catch (err) {
      console.error("[AdminPanel] fetchDetails:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`${SERVER}/api/support/tickets/${ticket._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[AdminPanel] fetchMessages:", err);
    }
  }

  async function handleBack() {
    try {
      if (ticket.status !== "resolved") {
        await handleStatusChange("pending");
      }
      await fetch(`${SERVER}/api/support/tickets/${ticket._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: "Support agent has left the chat. You can continue messaging and another agent will assist you.",
          senderType: "system",
        }),
      });
      socket?.emit("support:admin_left", { ticketId: ticket._id });
      onBack();
    } catch (err) {
      console.error("[AdminPanel] handleBack:", err);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !ticket) return;
    const text = input.trim();
    setInput("");
    socket?.emit("support:stop_typing", { ticketId: ticket._id, senderType: "admin" });
    try {
      await fetch(`${SERVER}/api/support/tickets/${ticket._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
    } catch (err) {
      console.error("[AdminPanel] sendMessage:", err);
    }
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    socket?.emit("support:typing", { ticketId: ticket._id, senderType: "admin" });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit("support:stop_typing", { ticketId: ticket._id, senderType: "admin" });
    }, 1500);
  }

  async function handleResolve() {
    try {
      await fetch(`${SERVER}/api/support/tickets/${ticket._id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resolutionSummary: resolveForm.summary, resolutionType: resolveForm.type }),
      });
      setShowResolveModal(false);
    } catch (err) {
      console.error("[AdminPanel] resolve:", err);
    }
  }

  async function handleRefund() {
    try {
      await fetch(`${SERVER}/api/support/tickets/${ticket._id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(refundForm),
      });
      setShowRefundModal(false);
      alert(`Refund of ₹${refundForm.amount} processed`);
    } catch (err) {
      console.error("[AdminPanel] refund:", err);
    }
  }

  async function handleNote() {
    try {
      await fetch(`${SERVER}/api/support/tickets/${ticket._id}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note }),
      });
      setNote("");
      setShowNoteModal(false);
    } catch (err) {
      console.error("[AdminPanel] note:", err);
    }
  }

  async function handleStatusChange(status) {
    try {
      await fetch(`${SERVER}/api/support/tickets/${ticket._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error("[AdminPanel] statusChange:", err);
    }
  }

  const isResolved = ticket.status === "resolved";

  return (
    <div style={s.page}>

      {/* ── Top Bar ── */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={handleBack}>← Back</button>
        <div style={s.topCenter}>
          <span style={s.ticketIdLabel}>{ticket.ticketId}</span>
          <span style={s.statusLabel}>{ticket.status?.toUpperCase()}</span>
          {isResolved && <span style={s.resolvedLabel}>✅ RESOLVED</span>}
        </div>
        <div style={s.topActions}>
          {!isResolved && (
            <>
              <button style={s.noteBtn} onClick={() => setShowNoteModal(true)}>📝 Note</button>
              <button style={s.refundBtn} onClick={() => setShowRefundModal(true)}>💰 Refund</button>
              <button style={s.resolveBtn} onClick={() => setShowResolveModal(true)}>✅ Resolve</button>
            </>
          )}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={s.layout}>

        {/* ══ LEFT PANEL ══ */}
        <div style={s.leftPanel}>

          {/* Customer */}
          <div style={s.card}>
            <div style={s.cardTitle}>👤 Customer</div>
            <div style={s.infoRow}><span style={s.infoLabel}>Name</span><span style={s.infoVal}>{ticket.userId?.name}</span></div>
            <div style={s.infoRow}><span style={s.infoLabel}>Email</span><span style={s.infoVal}>{ticket.userId?.email}</span></div>
            {userStats && (
              <>
                <div style={s.divider} />
                <div style={s.statsGrid}>
                  <div style={s.statItem}><span style={s.statN}>{userStats.totalOrders}</span><span style={s.statL}>Orders</span></div>
                  <div style={s.statItem}><span style={s.statN}>₹{userStats.totalSpent?.toLocaleString()}</span><span style={s.statL}>Spent</span></div>
                  <div style={s.statItem}><span style={s.statN}>{userStats.totalTickets}</span><span style={s.statL}>Tickets</span></div>
                </div>
                {userStats.totalSpent > 5000 && (
                  <div style={s.hviBadge}>⭐ High Value Customer</div>
                )}
              </>
            )}
          </div>

          {/* Order Details */}
          {orderDetails && (
            <div style={s.card}>
              <div style={s.cardTitle}>📦 Order Details</div>
              <div style={s.infoRow}><span style={s.infoLabel}>Restaurant</span><span style={s.infoVal}>{orderDetails.restaurant_name}</span></div>
              <div style={s.infoRow}><span style={s.infoLabel}>Status</span><span style={s.infoVal}>{orderDetails.status}</span></div>
              <div style={s.infoRow}><span style={s.infoLabel}>Payment</span><span style={s.infoVal}>{orderDetails.payment_status}</span></div>
              <div style={s.infoRow}><span style={s.infoLabel}>Total</span><span style={{ ...s.infoVal, fontWeight: 700, color: "#0f172a" }}>₹{orderDetails.total_amount}</span></div>
              <div style={s.divider} />
              <div style={s.cardTitle}>🛒 Items</div>
              {orderDetails.items?.map((item, i) => (
                <div key={i} style={s.itemRow}>
                  <span style={s.itemName}>{item.name}</span>
                  <span style={s.itemQty}>x{item.quantity}</span>
                  <span style={s.itemPrice}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Delivery Address */}
          {orderDetails?.delivery_address && (
            <div style={s.card}>
              <div style={s.cardTitle}>📍 Delivery Address</div>
              <div style={s.addressText}>
                {orderDetails.delivery_address.full_name}<br />
                {orderDetails.delivery_address.address_line}<br />
                {orderDetails.delivery_address.city}, {orderDetails.delivery_address.state} {orderDetails.delivery_address.pincode}
              </div>
            </div>
          )}

          {/* ✅ Edit Order Panel */}
          <OrderEditPanel
            ticket={ticket}
            orderDetails={orderDetails}
            token={token}
            onUpdated={fetchDetails}
          />

          {/* Quick Actions */}
          {!isResolved && (
            <div style={s.card}>
              <div style={s.cardTitle}>⚡ Quick Actions</div>
              <div style={s.actionsGrid}>
                {STATUS_FLOW.filter(st => st !== ticket.status && st !== "resolved").map((st) => (
                  <button key={st} style={s.actionBtn} onClick={() => handleStatusChange(st)}>
                    Set {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Log */}
          {ticket.actionLog?.length > 0 && (
            <div style={s.card}>
              <div style={s.cardTitle}>📋 Action Log</div>
              {ticket.actionLog.slice(-5).reverse().map((log, i) => (
                <div key={i} style={s.logItem}>
                  <span style={s.logAction}>{log.action}</span>
                  <span style={s.logTime}>{new Date(log.performedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ══ RIGHT: Chat Panel ══ */}
        <div style={s.chatPanel}>
          <div style={s.chatHeader}>
            <span style={s.chatTitle}>💬 Live Chat</span>
            <span style={s.chatSub}>{ticket.userId?.name}</span>
          </div>

          <div style={s.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{
                ...s.msgRow,
                justifyContent: m.senderType === "admin" ? "flex-end" : m.senderType === "system" ? "center" : "flex-start"
              }}>
                <div style={{
                  ...s.bubble,
                  ...(m.senderType === "admin" ? s.adminBubble : m.senderType === "system" ? s.systemBubble : s.userBubble),
                }}>
                  {m.senderType !== "system" && (
                    <div style={s.senderLabel}>
                      {m.senderType === "admin" ? "You (Admin)" : ticket.userId?.name}
                    </div>
                  )}
                  <p style={s.bubbleText}>{m.message}</p>
                  <span style={s.timestamp}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                <div style={s.userBubble}>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                    Customer is typing...
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {!isResolved ? (
            <div style={s.inputBar}>
              <input
                style={s.input}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a reply..."
              />
              <button style={s.sendBtn} onClick={sendMessage}>Send →</button>
            </div>
          ) : (
            <div style={s.resolvedBar}>✅ This ticket has been resolved. Chat is read-only.</div>
          )}
        </div>
      </div>

      {/* ══ RESOLVE MODAL ══ */}
      {showResolveModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Resolve Ticket</h3>
            <label style={s.label}>Resolution Type</label>
            <select style={s.select} value={resolveForm.type} onChange={(e) => setResolveForm({ ...resolveForm, type: e.target.value })}>
              {RESOLUTION_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <label style={s.label}>Resolution Notes</label>
            <textarea style={s.textarea} rows={3} value={resolveForm.summary}
              onChange={(e) => setResolveForm({ ...resolveForm, summary: e.target.value })}
              placeholder="Describe what was done..." />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button style={s.confirmBtn} onClick={handleResolve}>Resolve Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ REFUND MODAL ══ */}
      {showRefundModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Process Refund</h3>
            <label style={s.label}>Refund Type</label>
            <select style={s.select} value={refundForm.type} onChange={(e) => setRefundForm({ ...refundForm, type: e.target.value })}>
              <option value="full">Full Refund (₹{orderDetails?.total_amount})</option>
              <option value="partial">Partial Refund</option>
              <option value="item">Item Refund</option>
            </select>
            {refundForm.type !== "full" && (
              <>
                <label style={s.label}>Amount (₹)</label>
                <input style={s.inputField} type="number" value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })} placeholder="Enter amount" />
              </>
            )}
            <label style={s.label}>Reason</label>
            <input style={s.inputField} value={refundForm.reason}
              onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} placeholder="Reason for refund" />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowRefundModal(false)}>Cancel</button>
              <button style={s.confirmBtn} onClick={handleRefund}>Process Refund</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ NOTE MODAL ══ */}
      {showNoteModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>Add Internal Note</h3>
            <textarea style={s.textarea} rows={4} value={note}
              onChange={(e) => setNote(e.target.value)} placeholder="Internal note (not visible to customer)..." />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowNoteModal(false)}>Cancel</button>
              <button style={s.confirmBtn} onClick={handleNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  // page: { background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" },
 page: {
  background: "#f8fafc",

  height: "84vh",

  display: "flex",

  flexDirection: "column",

  overflow: "hidden",
},
  topBar: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  backBtn: { background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#64748b" },
  topCenter: { display: "flex", alignItems: "center", gap: 10 },
  ticketIdLabel: { fontSize: 15, fontWeight: 700, color: "#4f46e5" },
  statusLabel: { background: "#eff6ff", color: "#2563eb", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 },
  resolvedLabel: { background: "#f0fdf4", color: "#16a34a", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 },
  topActions: { display: "flex", gap: 8 },
  noteBtn: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13 },
  refundBtn: { background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  resolveBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  // layout: { display: "flex", flex: 1, gap: 0, padding: 0, height: "calc(100vh - 60px)" },
  layout: {display: "flex",  flex: 1,  minHeight: 0,  overflow: "hidden",  gap: 0,  padding: 0,},
  leftPanel: { width: 360, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, borderRight: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 },
  card: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px" },
  cardTitle: { fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 },
  infoRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  infoLabel: { fontSize: 12, color: "#94a3b8" },
  infoVal: { fontSize: 13, color: "#374151", fontWeight: 500 },
  divider: { borderTop: "1px solid #f1f5f9", margin: "10px 0" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" },
  statItem: { display: "flex", flexDirection: "column" },
  statN: { fontSize: 16, fontWeight: 700, color: "#0f172a" },
  statL: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase" },
  hviBadge: { marginTop: 8, background: "#fef9c3", color: "#854d0e", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, textAlign: "center" },
  itemRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  itemName: { fontSize: 13, color: "#374151", flex: 1 },
  itemQty: { fontSize: 12, color: "#94a3b8", marginRight: 8 },
  itemPrice: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  addressText: { fontSize: 13, color: "#374151", lineHeight: 1.7 },
  actionsGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  actionBtn: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", color: "#475569" },
  logItem: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  logAction: { fontSize: 12, color: "#374151" },
  logTime: { fontSize: 11, color: "#94a3b8" },
  chatPanel: { flex: 1, display: "flex", flexDirection: "column", background: "#fff" },
  chatHeader: { padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 },
  chatTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  chatSub: { fontSize: 13, color: "#94a3b8" },
  messages: { flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 },
  msgRow: { display: "flex" },
  bubble: { maxWidth: "72%", borderRadius: 14, padding: "10px 14px" },
  adminBubble: { background: "linear-gradient(135deg, #4f46e5, #6366f1)", borderBottomRightRadius: 4 },
  userBubble: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderBottomLeftRadius: 4 },
  systemBubble: { background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10, maxWidth: "85%" },
  senderLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 2, fontWeight: 600 },
  bubbleText: { margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "inherit", whiteSpace: "pre-wrap" },
  timestamp: { fontSize: 10, opacity: 0.5, display: "block", textAlign: "right", marginTop: 3 },
  inputBar: { borderTop: "1px solid #f1f5f9", padding: "12px 20px", display: "flex", gap: 10 },
  input: { flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", color: "#1e293b" },
  sendBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  resolvedBar: { padding: "14px 20px", background: "#f0fdf4", color: "#16a34a", fontSize: 13, fontWeight: 500, textAlign: "center", borderTop: "1px solid #bbf7d0" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  modalTitle: { margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: "#0f172a" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.5px" },
  select: { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", color: "#1e293b" },
  textarea: { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", color: "#1e293b", resize: "vertical", boxSizing: "border-box" },
  inputField: { width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", color: "#1e293b", boxSizing: "border-box" },
  modalActions: { display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" },
  cancelBtn: { background: "#f1f5f9", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, color: "#64748b" },
  confirmBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
};