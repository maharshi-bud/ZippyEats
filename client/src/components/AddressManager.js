"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";

const LABELS = ["Home", "Work", "Other"];

const emptyForm = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line: "",
  city: "Ahmedabad",
  state: "Gujarat",
  pincode: "",
};

export default function AddressManager() {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAddresses = async () => {
    try {
      const res = await api.get("/users/addresses");
      setAddresses(res.data.data);
    } catch {
      setAddresses([]);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditId(addr._id);
    setForm({
      label: addr.label,
      full_name: addr.full_name,
      phone: addr.phone,
      address_line: addr.address_line,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone || !form.address_line) {
      setError("Name, phone, and address are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editId) {
        const res = await api.put(`/users/addresses/${editId}`, form);
        setAddresses(res.data.data);
      } else {
        const res = await api.post("/users/addresses", form);
        setAddresses(res.data.data);
      }

      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/users/addresses/${id}`);
      setAddresses(res.data.data);
    } catch {
      alert("Could not delete address.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await api.patch(`/users/addresses/${id}/default`);
      setAddresses(res.data.data);
    } catch {
      alert("Could not update default address.");
    }
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/45 p-6 mb-10 shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-slate-800">
          Saved Addresses
        </h2>

        <button
          onClick={openNew}
          className="text-sm px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition"
        >
          + Add Address
        </button>
      </div>

      {!addresses && !showForm && (
        <p className="text-sm text-slate-400 text-center py-6">
          No saved addresses yet. Add one to speed up checkout!
        </p>
      )}

      <div className="space-y-3">
        {addresses &&
          addresses.map((addr) => (
            <div
              key={addr._id}
              className={`rounded-xl p-4 flex items-start justify-between gap-4 transition-colors ${
                addr.is_default
                  ? "border border-emerald-400 bg-emerald-50/70"
                  : "border border-white/60 bg-white/35 hover:bg-white/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {addr.label}
                  </span>

                  {addr.is_default && (
                    <span className="text-xs font-semibold text-emerald-600">
                      ✓ Default
                    </span>
                  )}
                </div>

                <p className="font-medium text-slate-800 text-sm">
                  {addr.full_name}
                </p>

                <p className="text-sm text-slate-500">
                  +91 {addr.phone}
                </p>

                <p className="text-sm text-slate-500 truncate">
                  {addr.address_line}, {addr.city}, {addr.state}
                  {addr.pincode ? ` - ${addr.pincode}` : ""}
                </p>
              </div>

              <div className="flex flex-col gap-1 flex-shrink-0">
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    className="text-xs text-blue-600 hover:underline text-right"
                  >
                    Set default
                  </button>
                )}

                <button
                  onClick={() => openEdit(addr)}
                  className="text-xs text-slate-600 hover:underline text-right"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(addr._id)}
                  className="text-xs text-red-500 hover:underline text-right"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {showForm && (
        <div className="mt-5 rounded-xl border border-white/60 bg-white/45 p-5 shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)]">
          <h3 className="font-semibold text-slate-800 mb-4">
            {editId ? "Edit Address" : "New Address"}
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {LABELS.map((l) => (
              <button
                key={l}
                onClick={() => setForm((f) => ({ ...f, label: l }))}
                className={`py-2 rounded-lg text-sm font-medium border transition ${
                  form.label === l
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <input
              placeholder="Full name *"
              value={form.full_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, full_name: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              placeholder="Phone number *"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              placeholder="Flat / Building / Street *"
              value={form.address_line}
              onChange={(e) =>
                setForm((f) => ({ ...f, address_line: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="grid grid-cols-3 gap-3">
              <input
                placeholder="City"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <input
                placeholder="State"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <input
                placeholder="Pincode"
                value={form.pincode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pincode: e.target.value }))
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Address"}
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:border-slate-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}