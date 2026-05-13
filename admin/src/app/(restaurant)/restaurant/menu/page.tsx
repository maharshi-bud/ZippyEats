"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  CheckCircle,
  LeafyGreen,
  Drumstick,
  ImageOff,
} from "lucide-react";
import api from "../../../../lib/api";

// ─── types ───────────────────────────────────────────────────────────────────

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description: string;
  cuisine: string;
  veg: boolean;
  image: string | null;
  rating: number;
  totalReviews: number;
}

const EMPTY_FORM = {
  name: "",
  price: "",
  description: "",
  cuisine: "",
  veg: true,
  image: "",
};

// ─── small helpers ────────────────────────────────────────────────────────────

function Toast({
  msg,
  type,
}: {
  msg: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[999] flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-xl transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={16} />
      ) : (
        <X size={16} />
      )}
      {msg}
    </div>
  );
}

function VegBadge({ veg }: { veg: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
        veg
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {veg ? (
        <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-green-600 bg-white">
          <div className="h-2 w-2 rounded-full bg-green-600" />
        </div>
      ) : (
        <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-red-600 bg-white">
          <div className="h-2 w-2 rounded-full bg-red-600" />
        </div>
      )}

      {veg ? "Veg" : "Non-veg"}
    </span>
  );
}

// ─── item form modal ──────────────────────────────────────────────────────────

function ItemModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<MenuItem> | null;
  onClose: () => void;
  onSaved: (item: MenuItem) => void;
}) {
  const isEdit = !!initial?._id;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    price: initial?.price?.toString() ?? "",
    description: initial?.description ?? "",
    cuisine: initial?.cuisine ?? "",
    veg: initial?.veg ?? true,
    image: initial?.image ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price || !form.cuisine.trim()) {
      setError("Name, price and cuisine are required.");
      return;
    }
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      setError("Price must be a positive number.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      cuisine: form.cuisine.trim(),
      veg: form.veg,
      image: form.image.trim() || null,
    };

    try {
      let res;
      if (isEdit) {
        res = await api.put(
          `/restaurant-owner/menu/${initial!._id}`,
          payload
        );
      } else {
        res = await api.post("/restaurant-owner/menu", payload);
      }
      onSaved(res.data.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to save. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#151924] p-6 shadow-2xl">
        {/* header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Edit Item" : "Add New Item"}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20"
          >
            <X size={16} />
          </button>
        </div>

        {/* fields */}
        <div className="space-y-4">
          {/* name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Paneer Tikka"
              className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* price + cuisine row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Price (₹) *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="e.g. 280"
                className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Cuisine *
              </label>
              <input
                value={form.cuisine}
                onChange={(e) => set("cuisine", e.target.value)}
                placeholder="e.g. Indian"
                className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Briefly describe the dish…"
              className="w-full resize-none rounded-xl border border-white/10 bg-[#0f1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* image URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Image URL
            </label>
            <input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* veg toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300">Type</span>
            <button
              onClick={() => set("veg", true)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                form.veg
                  ? "bg-green-500 text-white"
                  : "bg-white/10 text-gray-400 hover:bg-white/15"
              }`}
            >
              {/* 🌿 Veg */}
              <div className="flex items-center gap-2">
  <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-white bg-white">
    <div className="h-2 w-2 rounded-full bg-green-600" />
  </div>

  <span>Veg</span>
</div>
            </button>
            <button
              onClick={() => set("veg", false)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                !form.veg
                  ? "bg-red-500 text-white"
                  : "bg-white/10 text-gray-400 hover:bg-white/15"
              }`}
            >
              {/* 🍗 Non-veg */}
              <div className="flex items-center gap-2">
  <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-white bg-white">
    <div className="h-2 w-2 rounded-full bg-red-600" />
  </div>

  <span>Non-veg</span>
</div>
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        {/* actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Add Item"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({
  item,
  onClose,
  onDeleted,
}: {
  item: MenuItem;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/restaurant-owner/menu/${item._id}`);
      onDeleted(item._id);
    } catch {
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#151924] p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-bold text-white">Delete item?</h2>
        <p className="mb-6 text-sm text-gray-400">
          <span className="font-semibold text-white">{item.name}</span> will
          be permanently removed from your menu.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVeg, setFilterVeg] = useState<"all" | "veg" | "nonveg">("all");

  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get("/restaurant-owner/menu");
        setItems(res.data.data ?? []);
      } catch {
        showToast("Failed to load menu items.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // ── toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── callbacks ──────────────────────────────────────────────────────────────
  const handleSaved = (saved: MenuItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i._id === saved._id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setEditItem(null);
    setShowAddModal(false);
    showToast(
      editItem ? "Item updated successfully." : "Item added successfully.",
      "success"
    );
  };

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
    setDeleteItem(null);
    showToast("Item deleted.", "success");
  };

  // ── filtered list ──────────────────────────────────────────────────────────
  const filtered = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.cuisine.toLowerCase().includes(search.toLowerCase());
    const matchVeg =
      filterVeg === "all"
        ? true
        : filterVeg === "veg"
        ? item.veg
        : !item.veg;
    return matchSearch && matchVeg;
  });

  // ── grouped by cuisine ─────────────────────────────────────────────────────
  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.cuisine || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="mt-1 text-gray-500">
            {items.length} item{items.length !== 1 ? "s" : ""} on your menu
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-600 transition"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* ── FILTERS ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* search */}
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or cuisine…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 shadow-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* veg filter */}
        {(["all", "veg", "nonveg"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterVeg(f)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              filterVeg === f
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {/* {f === "all" ? "All" : f === "veg" ? "🌿 Veg" : "🍗 Non-veg"} */}
          <div className="flex items-center gap-2">
  {f !== "all" && (
    <>
      {f === "veg" ? (
        <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-green-600 bg-white">
          <div className="h-2 w-2 rounded-full bg-green-600" />
        </div>
      ) : (
        <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-red-600 bg-white">
          <div className="h-2 w-2 rounded-full bg-red-600" />
        </div>
      )}
    </>
  )}

  <span>
    {f === "all"
      ? "All"
      : f === "veg"
      ? "Veg"
      : "Non-veg"}
  </span>
</div>
          </button>
        ))}
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div className="flex h-40 items-center justify-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading menu…</span>
        </div>
      )}

      {/* ── EMPTY ── */}
      {!loading && filtered.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white text-gray-400">
          <ImageOff size={28} />
          <p className="text-sm">
            {items.length === 0
              ? "No menu items yet. Add your first item!"
              : "No items match your search."}
          </p>
        </div>
      )}

      {/* ── GROUPED TABLE ── */}
      {!loading &&
        Object.entries(grouped).map(([cuisine, cuisineItems]) => (
          <div key={cuisine} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* cuisine header */}
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
              <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                {cuisine}
                <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {cuisineItems.length}
                </span>
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="p-4 text-left">Item</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-left">Price</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Rating</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {cuisineItems.map((item) => (
                  <tr
                    key={item._id}
                    className="group transition hover:bg-gray-50"
                  >
                    {/* name + image */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <ImageOff size={18} />
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-800">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* description */}
                    <td className="max-w-[220px] p-4">
                      <p className="truncate text-sm text-gray-500">
                        {item.description || (
                          <span className="italic text-gray-300">
                            No description
                          </span>
                        )}
                      </p>
                    </td>

                    {/* price */}
                    <td className="p-4">
                      <span className="font-bold text-gray-800">
                        ₹{item.price}
                      </span>
                    </td>

                    {/* veg */}
                    <td className="p-4">
                      <VegBadge veg={item.veg} />
                    </td>

                    {/* rating */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        ⭐ {item.rating.toFixed(1)}
                        <span className="text-gray-400">
                          ({item.totalReviews})
                        </span>
                      </span>
                    </td>

                    {/* actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditItem(item)}
                          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* ── MODALS ── */}
      {(showAddModal || editItem) && (
        <ItemModal
          initial={editItem}
          onClose={() => {
            setEditItem(null);
            setShowAddModal(false);
          }}
          onSaved={handleSaved}
        />
      )}

      {deleteItem && (
        <DeleteModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onDeleted={handleDeleted}
        />
      )}

      {/* ── TOAST ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}