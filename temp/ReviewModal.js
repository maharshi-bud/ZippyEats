"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="text-2xl leading-none transition"
          style={{ color: s <= (hovered || value) ? "#f59e0b" : "#d1d5db" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { onClose(); return; }

    api.get("/reviews/reviewable")
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [onClose]);

  const key = (item) => `${item.order_id}_${item.menu_item_id}`;

  const handleSubmit = async (item) => {
    const k = key(item);
    const rating = ratings[k];
    if (!rating) return;

    setSubmitting(k);
    try {
      await api.post("/reviews", {
        order_id: item.order_id,
        menu_item_id: item.menu_item_id,
        rating,
        comment: comments[k] || "",
      });
      setSubmitted((prev) => ({ ...prev, [k]: true }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(null);
    }
  };

  const pending = items.filter((i) => !submitted[key(i)]);
  const done = items.filter((i) => submitted[key(i)]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Rate your order</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your reviews help others choose well 🙌</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition text-sm"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loading && (
            <p className="text-center text-slate-400 py-8">Loading…</p>
          )}

          {!loading && items.length === 0 && (
            <p className="text-center text-slate-400 py-8">
              No items to review right now.
            </p>
          )}

          {pending.map((item) => {
            const k = key(item);
            return (
              <div key={k} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center gap-3 mb-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      Ordered {new Date(item.order_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <StarPicker
                  value={ratings[k] || 0}
                  onChange={(v) => setRatings((r) => ({ ...r, [k]: v }))}
                />

                <textarea
                  rows={2}
                  placeholder="Add a comment (optional)"
                  value={comments[k] || ""}
                  onChange={(e) => setComments((c) => ({ ...c, [k]: e.target.value }))}
                  className="mt-2 w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />

                <button
                  onClick={() => handleSubmit(item)}
                  disabled={!ratings[k] || submitting === k}
                  className="mt-2 w-full py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-40"
                >
                  {submitting === k ? "Submitting…" : "Submit review"}
                </button>
              </div>
            );
          })}

          {done.length > 0 && (
            <div className="text-center text-sm text-green-600 font-medium pt-2">
              ✓ {done.length} review{done.length > 1 ? "s" : ""} submitted. Thank you!
            </div>
          )}
        </div>

        {!loading && pending.length === 0 && done.length > 0 && (
          <div className="px-6 py-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-700 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
