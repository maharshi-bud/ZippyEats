// @ts-nocheck
"use client";
// ============================================================
// FILE: admin/src/components/support/OrderEditPanel.tsx
// ============================================================
// Import and add inside AdminSupportPanel's left panel:
//
//   import OrderEditPanel from "./OrderEditPanel";
//   <OrderEditPanel ticket={ticket} orderDetails={orderDetails}
//                   token={token} onUpdated={fetchDetails} />
// ============================================================

import { useState } from "react";

const SERVER = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010";

const ADDRESS_FIELDS = [
  { key: "delivery_address.full_name",    label: "Recipient Name",  type: "text" },
  { key: "delivery_address.phone",        label: "Phone",           type: "text" },
  { key: "delivery_address.address_line", label: "Address Line",    type: "text" },
  { key: "delivery_address.city",         label: "City",            type: "text" },
  { key: "delivery_address.state",        label: "State",           type: "text" },
  { key: "delivery_address.pincode",      label: "Pincode",         type: "text" },
];

export default function OrderEditPanel({ ticket, orderDetails, token, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState(null); // key of address field
  const [fieldValue, setFieldValue] = useState("");
  const [reason, setReason] = useState("");
  const [editingItems, setEditingItems] = useState(false);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function getAddressValue(key) {
    const field = key.replace("delivery_address.", "");
    return orderDetails?.delivery_address?.[field] || "";
  }

  function startEditField(key) {
    setEditingField(key);
    setFieldValue(getAddressValue(key));
    setReason("");
    setEditingItems(false);
  }

  function startEditItems() {
    setEditingItems(true);
    setEditingField(null);
    setReason("");
    // Deep clone items
    setItems(
      (orderDetails?.items || []).map((item) => ({ ...item }))
    );
  }

  async function saveField() {
    if (!fieldValue.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${SERVER}/api/support/tickets/${ticket._id}/edit-order`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ field: editingField, value: fieldValue, reason }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg("✅ Updated successfully");
      setEditingField(null);
      onUpdated?.();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("[OrderEditPanel] saveField:", err);
    } finally {
      setSaving(false);
    }
  }

  async function saveItems() {
    if (items.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${SERVER}/api/support/tickets/${ticket._id}/edit-order`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ field: "items", value: items, reason }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      setSuccessMsg("✅ Items updated successfully");
      setEditingItems(false);
      onUpdated?.();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("[OrderEditPanel] saveItems:", err);
    } finally {
      setSaving(false);
    }
  }

  function updateItemQty(index, qty) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, Number(qty)) } : item
      )
    );
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  if (!orderDetails) return null;

  return (
    <div style={s.card}>
      {/* Header */}
      <button style={s.sectionToggle} onClick={() => setExpanded(!expanded)}>
        <span style={s.cardTitle}>✏️ Edit Order</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{expanded ? "▲ Collapse" : "▼ Expand"}</span>
      </button>

      {successMsg && <div style={s.successBanner}>{successMsg}</div>}

      {expanded && (
        <>
          {/* ── Address Fields ── */}
          <div style={s.sectionLabel}>📍 Delivery Address</div>
          {ADDRESS_FIELDS.map((f) => (
            <div key={f.key} style={s.fieldRow}>
              <div style={s.fieldInfo}>
                <span style={s.fieldLabel}>{f.label}</span>
                <span style={s.fieldVal}>{getAddressValue(f.key) || "—"}</span>
              </div>
              <button style={s.editBtn} onClick={() => startEditField(f.key)}>
                Edit
              </button>
            </div>
          ))}

          {/* ── Inline field editor ── */}
          {editingField && (
            <div style={s.inlineEditor}>
              <label style={s.editorLabel}>
                New value for "{ADDRESS_FIELDS.find(f => f.key === editingField)?.label}":
              </label>
              <input
                style={s.editorInput}
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveField()}
                autoFocus
              />
              <label style={s.editorLabel}>Reason (optional):</label>
              <input
                style={s.editorInput}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer requested address change"
              />
              <div style={s.editorActions}>
                <button style={s.cancelEditBtn} onClick={() => setEditingField(null)}>Cancel</button>
                <button style={s.saveEditBtn} onClick={saveField} disabled={saving}>
                  {saving ? "Saving..." : "Save Change"}
                </button>
              </div>
            </div>
          )}

          {/* ── Items ── */}
          <div style={{ ...s.sectionLabel, marginTop: 14 }}>🛒 Order Items</div>

          {!editingItems ? (
            <>
              {orderDetails.items?.map((item, i) => (
                <div key={i} style={s.itemDisplayRow}>
                  <span style={s.itemName}>{item.name}</span>
                  <span style={s.itemQtyBadge}>x{item.quantity}</span>
                  <span style={s.itemPrice}>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <button style={s.editItemsBtn} onClick={startEditItems}>
                ✏️ Edit Items / Quantity
              </button>
            </>
          ) : (
            <div style={s.itemEditor}>
              {items.map((item, i) => (
                <div key={i} style={s.itemEditorRow}>
                  <span style={s.itemEditorName}>{item.name}</span>
                  <div style={s.itemEditorControls}>
                    <button
                      style={s.qtyBtn}
                      onClick={() => updateItemQty(i, item.quantity - 1)}
                    >−</button>
                    <span style={s.qtyVal}>{item.quantity}</span>
                    <button
                      style={s.qtyBtn}
                      onClick={() => updateItemQty(i, item.quantity + 1)}
                    >+</button>
                    <button style={s.removeBtn} onClick={() => removeItem(i)}>🗑</button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 10 }}>
                <label style={s.editorLabel}>New total: ₹{
                  items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
                }</label>
              </div>

              <label style={s.editorLabel}>Reason:</label>
              <input
                style={s.editorInput}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Item was unavailable"
              />

              <div style={s.editorActions}>
                <button style={s.cancelEditBtn} onClick={() => setEditingItems(false)}>Cancel</button>
                <button style={s.saveEditBtn} onClick={saveItems} disabled={saving || items.length === 0}>
                  {saving ? "Saving..." : "Save Items"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  card: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px" },
  sectionToggle: {
    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 10,
  },
  cardTitle: { fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px" },
  successBanner: {
    background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
    padding: "7px 12px", fontSize: 13, color: "#16a34a", marginBottom: 10,
  },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 },
  fieldRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  fieldInfo: { display: "flex", flexDirection: "column" },
  fieldLabel: { fontSize: 11, color: "#94a3b8" },
  fieldVal: { fontSize: 13, color: "#374151", fontWeight: 500 },
  editBtn: {
    background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
    borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, flexShrink: 0,
  },
  inlineEditor: { background: "#f8fafc", borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 8 },
  editorLabel: { display: "block", fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 },
  editorInput: {
    width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
    padding: "8px 10px", fontSize: 13, outline: "none", color: "#1e293b",
    marginBottom: 8, boxSizing: "border-box",
  },
  editorActions: { display: "flex", gap: 8, justifyContent: "flex-end" },
  cancelEditBtn: { background: "#f1f5f9", border: "none", borderRadius: 7, padding: "7px 14px", cursor: "pointer", fontSize: 12, color: "#64748b" },
  saveEditBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  itemDisplayRow: { display: "flex", alignItems: "center", marginBottom: 6 },
  itemName: { flex: 1, fontSize: 13, color: "#374151" },
  itemQtyBadge: { fontSize: 12, color: "#94a3b8", marginRight: 8 },
  itemPrice: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  editItemsBtn: {
    marginTop: 8, width: "100%", background: "#eff6ff", color: "#2563eb",
    border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px", fontSize: 13,
    cursor: "pointer", fontWeight: 600,
  },
  itemEditor: { background: "#f8fafc", borderRadius: 10, padding: 12, marginTop: 8 },
  itemEditorRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  itemEditorName: { fontSize: 13, color: "#374151", flex: 1 },
  itemEditorControls: { display: "flex", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 26, height: 26, borderRadius: 6, border: "1px solid #e2e8f0",
    background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  qtyVal: { fontSize: 14, fontWeight: 700, color: "#0f172a", minWidth: 20, textAlign: "center" },
  removeBtn: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 6px", cursor: "pointer", fontSize: 13 },
};
