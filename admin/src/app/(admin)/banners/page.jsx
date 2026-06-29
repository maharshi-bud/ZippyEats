"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import PermissionGuard from "../../../components/PermissionGuard";
import { Pencil, Trash2 } from "lucide-react";
const API_URL = api.defaults.baseURL || `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010"}/api`;

// ── Modal ─────────────────────────────────────────────────
function Modal({ onClose, children, size = "max-w-4xl" }) {
  return (
    <div
      className="
    fixed
    inset-0
    z-50
    flex
    items-center
    justify-center
    bg-black/60
    backdrop-blur-sm
    p-4

    animate-in
    fade-in
    duration-200
  "
    >
      <div className={`relative w-full ${size} rounded-3xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl flex flex-col`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white transition shadow-sm"
        >
          ✕
        </button>
        <div className="w-full rounded-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Custom Delete Confirm Dialog ──────────────────────────
function DeleteConfirmDialog({ item, type, onClose, onConfirm }) {
  const title = type === "promo" ? item.title : item.itemName;
  const typeLabel = type === "promo" ? "promo banner" : "rush deal";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-100">
          <Trash2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Delete {type === "promo" ? "Banner" : "Deal"}?</h3>
          <p className="text-sm text-slate-500">This action cannot be undone</p>
        </div>
      </div>

      <p className="text-slate-600 leading-relaxed text-sm">
        Are you sure you want to delete the {typeLabel} <span className="font-semibold text-slate-900">"{title || "Untitled"}"</span>?
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="rounded-xl bg-slate-100 border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-650 hover:shadow-lg hover:shadow-red-500/10 transition-all cursor-pointer"
        >
          Delete Permanently
        </button>
      </div>
    </div>
  );
}

// ── Collapsible ───────────────────────────────────────────
function Collapsible({ title, count, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-md shadow-sm overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <span className="font-semibold text-slate-700">
          {title}
          {count > 0 && (
            <span className="ml-2 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {count}
            </span>
          )}
        </span>
        <span className="text-slate-400 text-lg transition-transform duration-300">{open ? "−" : "+"}</span>
      </button>
      <div
        className={`
    overflow-hidden
    transition-all
    duration-300
    ${open
            ? "max-h-[1200px] opacity-100"
            : "max-h-0 opacity-0"
          }
  `}
      >
        <div className="px-5 pb-5">
          {children}
        </div>
      </div>
      {/* {open && <div className="px-5 pb-5">{children}</div>} */}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────
function Toggle({ checked, onChange, loading }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-200"
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all duration-300 ease-out ${checked ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );
}

const panelClass =
  "rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300";

const inputCls =
  "w-full rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20";
const labelCls =
  "absolute -top-2.5 left-3 z-10 bg-white px-2 text-xs font-semibold text-emerald-600";

// ─────────────────────────────────────────────────────────────
function StablePromoForm({
  promoModal,
  promoForm,
  setPromoForm,
  handlePromoSubmit,
  previewUrl,
}) {
  const previewImage = previewUrl || promoForm.image;

  return (
    <form onSubmit={handlePromoSubmit} className="grid gap-8 p-8 md:grid-cols-2 items-start">
      <div className="md:col-span-2">
        <h2 className="text-2xl font-bold text-slate-900">
          {promoModal === "edit" ? "Edit Promo Banner" : "Add Promo Banner"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">Manage homepage promotional banners</p>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <label className={labelCls}>Banner Title</label>
          <input
            type="text"
            value={promoForm.title}
            onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
            className={inputCls}
            required
          />
        </div>

        <div className="relative">
          <label className={labelCls}>Image URL</label>
          <input
            type="text"
            value={promoForm.image}
            onChange={(e) => setPromoForm({ ...promoForm, image: e.target.value })}
            className={inputCls}
            placeholder="https://..."
          />
        </div>

        <div className="relative">
          <label className={labelCls}>Upload Image (overrides URL)</label>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPromoForm({ ...promoForm, imageFile: e.target.files[0] })}
              className="w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-600"
            />
          </div>
          {promoForm.imageFile && (
            <p className="mt-2 text-sm text-emerald-600 font-semibold">Selected: {promoForm.imageFile.name}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Live Preview</p>
          {previewImage ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
              <div className="h-40 overflow-hidden">
                <img src={previewImage} alt="Banner preview" className="h-full w-full object-cover" />
              </div>
              <div className="p-4 bg-white">
                <h3 className="text-md font-bold text-slate-900">{promoForm.title || "Banner Preview"}</h3>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
              <span className="text-sm font-medium">No image source provided</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-base font-bold text-white transition hover:bg-emerald-500 shadow hover:shadow-md cursor-pointer"
        >
          {promoModal === "edit" ? "Save Changes" : "Create Banner"}
        </button>
      </div>
    </form>
  );
}

function StableRushForm({
  rushModal,
  rushForm,
  setRushForm,
  restaurants,
  menuItems,
  selectedItemPrice,
  setSelectedItemPrice,
  fetchRestaurantMenu,
  editingDeal,
  handleRushSubmit,
}) {
  return (
    <form onSubmit={handleRushSubmit} className="grid gap-8 p-8 md:grid-cols-2 items-start">
      <div className="md:col-span-2">
        <h2 className="text-2xl font-bold text-slate-900">
          {rushModal === "edit" ? "Edit Rush Deal" : "Create Rush Deal"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">Configure flash discounts and limited offers</p>
      </div>

      <div className="space-y-6">
        {rushModal === "create" && (
          <>
            <div className="relative">
              <label className={labelCls}>Restaurant</label>
              <select
                value={rushForm.restaurant_id}
                onChange={(e) => {
                  setRushForm({ ...rushForm, restaurant_id: e.target.value, menuItem: "" });
                  setSelectedItemPrice(0);
                  fetchRestaurantMenu(e.target.value);
                }}
                className={inputCls}
                required
              >
                <option value="">Select Restaurant</option>
                {restaurants.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className={labelCls}>Dish</label>
              <select
                value={rushForm.menuItem}
                onChange={(e) => {
                  const sel = menuItems.find((m) => m._id === e.target.value);
                  setSelectedItemPrice(sel?.price || 0);
                  setRushForm({ ...rushForm, menuItem: e.target.value, discountPrice: sel?.price || "", discountPercent: 0 });
                }}
                className={inputCls}
                required
              >
                <option value="">Select Dish</option>
                {menuItems.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} - Rs.{m.price}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {rushModal === "edit" && editingDeal && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs text-slate-500 mb-1">Item</p>
            <p className="text-slate-900 font-semibold">{editingDeal.itemName}</p>
          </div>
        )}

        <div className="relative">
          <label className={labelCls}>Deal Expiry</label>
          <input
            type="datetime-local"
            value={rushForm.endsAt}
            onChange={(e) => setRushForm({ ...rushForm, endsAt: e.target.value })}
            className={`${inputCls} [color-scheme:light]`}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-5 grid-cols-2">
          <div className="relative">
            <label className={labelCls}>Final Price (Rs.)</label>
            <input
              type="number"
              value={rushForm.discountPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                const pct = selectedItemPrice > 0
                  ? Math.round(((selectedItemPrice - val) / selectedItemPrice) * 100)
                  : 0;
                setRushForm({ ...rushForm, discountPrice: val, discountPercent: pct });
              }}
              className={inputCls}
            />
          </div>
          <div className="relative">
            <label className={labelCls}>Discount %</label>
            <input
              type="number"
              value={rushForm.discountPercent}
              onChange={(e) => {
                const pct = Number(e.target.value);
                const fp = selectedItemPrice > 0
                  ? Math.round(selectedItemPrice * (1 - pct / 100))
                  : 0;
                setRushForm({ ...rushForm, discountPercent: pct, discountPrice: fp });
              }}
              className={inputCls}
            />
          </div>
        </div>

        {selectedItemPrice > 0 ? (
          <div className="grid gap-4 grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Original Price</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Rs.{selectedItemPrice}</h3>
            </div>

            {rushForm.discountPrice > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Customer Saves</p>
                <h3 className="mt-1 text-xl font-bold text-emerald-600">
                  Rs.{selectedItemPrice - rushForm.discountPrice}
                </h3>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-5 text-center text-slate-400">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Price Analysis</p>
            <p className="text-xs text-slate-400">Select a restaurant and dish to calculate customer savings</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-base font-bold text-white transition hover:bg-emerald-500 cursor-pointer"
        >
          {rushModal === "edit" ? "Save Changes" : "Create Rush Deal"}
        </button>
      </div>
    </form>
  );
}

export default function BannersPage() {
  const [activeTab, setActiveTab] = useState("promo");
  const [promoBanners, setPromoBanners] = useState([]);
  const [rushDeals, setRushDeals] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItemPrice, setSelectedItemPrice] = useState(0);
  const [togglingId, setTogglingId] = useState(null);

  // modal modes: null | "create" | "edit"
  const [promoModal, setPromoModal] = useState(null);
  const [rushModal, setRushModal] = useState(null);
  const [editingPromo, setEditingPromo] = useState(null);
  const [editingDeal, setEditingDeal] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null | { type: "promo" | "rush", item: any }

  const emptyPromo = { title: "", image: "", link: "", imageFile: null };
  const emptyRush = { restaurant_id: "", menuItem: "", discountPrice: "", discountPercent: "", endsAt: "" };

  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [rushForm, setRushForm] = useState(emptyRush);

  useEffect(() => {
    if (!promoForm.imageFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(promoForm.imageFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [promoForm.imageFile]);

  useEffect(() => {
    fetchPromoBanners();
    fetchRushDeals();
    fetchRestaurants();
  }, []);

  // ── Fetchers ─────────────────────────────────────────────
  const fetchPromoBanners = async () => {
    try {
      // Admin needs ALL banners (active + inactive), so hit admin endpoint
      const r = await api.get("/admin/banners");
      setPromoBanners(r.data.data || []);
    } catch {
      // fallback to public endpoint
      try { const r = await api.get("/banners"); setPromoBanners(r.data.data || []); } catch { }
    }
  };

  const fetchRushDeals = async () => {
    try {
      const r = await api.get("/admin/rush-deals");
      setRushDeals(r.data.data || []);
    } catch {
      try { const r = await api.get("/rush-deals"); setRushDeals(r.data.data || []); } catch { }
    }
  };

  const fetchRestaurants = async () => {
    try { const r = await api.get("/restaurants"); setRestaurants(r.data.data || []); } catch { }
  };

  const fetchRestaurantMenu = async (id) => {
    try { const r = await api.get(`/restaurant/${id}`); setMenuItems(r.data.data.menu || []); } catch { }
  };

  // ── Splits ───────────────────────────────────────────────
  const now = new Date();
  const activeDeals = rushDeals.filter((d) => !d.endsAt || new Date(d.endsAt) > now);
  const expiredDeals = rushDeals.filter((d) => d.endsAt && new Date(d.endsAt) <= now);

  // ── Open edit promo ───────────────────────────────────────
  function openEditPromo(banner) {
    setEditingPromo(banner);
    setPromoForm({ title: banner.title || "", image: banner.image || "", link: banner.link || "", imageFile: null });
    setPromoModal("edit");
  }

  // ── Open edit deal ────────────────────────────────────────
  function openEditDeal(deal) {
    setEditingDeal(deal);
    setSelectedItemPrice(deal.oldPrice || 0);
    setRushForm({
      restaurant_id: deal.restaurant_id || "",
      menuItem: deal.menuItem?._id || deal.menuItem || "",
      discountPrice: deal.discountPrice || "",
      discountPercent: deal.discountPercent || "",
      endsAt: deal.endsAt ? new Date(deal.endsAt).toISOString().slice(0, 16) : "",
    });
    if (deal.restaurant_id) fetchRestaurantMenu(deal.restaurant_id);
    setRushModal("edit");
  }

  // ── Toggle rush deal active ───────────────────────────────
  const toggleDealActive = async (deal) => {
    setTogglingId(deal._id);
    try {
      await api.put(`/admin/rush-deals/${deal._id}`, { isActive: !deal.isActive });
      setRushDeals((prev) =>
        prev.map((d) => (d._id === deal._id ? { ...d, isActive: !d.isActive } : d))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Toggle promo banner active ────────────────────────────
  const toggleBannerActive = async (banner) => {
    setTogglingId(banner._id);
    try {
      await api.put(`/admin/banners/${banner._id}`, { isActive: !banner.isActive });
      setPromoBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Create promo ──────────────────────────────────────────
  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("title", promoForm.title);
      fd.append("image", promoForm.image);
      fd.append("link", promoForm.link);
      if (promoForm.imageFile) fd.append("imageFile", promoForm.imageFile);

      if (promoModal === "edit") {
        await api.put(`/admin/banners/${editingPromo._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/admin/banners", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setPromoForm(emptyPromo);
      setPromoModal(null);
      setEditingPromo(null);
      fetchPromoBanners();
    } catch (err) { console.error(err); }
  };

  // ── Create / update rush deal ─────────────────────────────
  const handleRushSubmit = async (e) => {
    e.preventDefault();
    try {
      if (rushModal === "edit") {
        await api.put(`/admin/rush-deals/${editingDeal._id}`, {
          discountPrice: rushForm.discountPrice,
          discountPercent: rushForm.discountPercent,
          endsAt: rushForm.endsAt,
        });
      } else {
        await api.post("/admin/rush-deals", rushForm);
      }

      setRushForm(emptyRush);
      setSelectedItemPrice(0);
      setRushModal(null);
      setEditingDeal(null);
      fetchRushDeals();
    } catch (err) { console.error(err); }
  };

  // ── Delete ────────────────────────────────────────────────
  const deletePromoBanner = (banner) => {
    setDeleteConfirm({ type: "promo", item: banner });
  };
  const deleteRushDeal = (deal) => {
    setDeleteConfirm({ type: "rush", item: deal });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, item } = deleteConfirm;
    try {
      if (type === "promo") {
        await api.delete(`/admin/banners/${item._id}`);
        fetchPromoBanners();
      } else {
        await api.delete(`/admin/rush-deals/${item._id}`);
        fetchRushDeals();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ─────────────────────────────────────────────────────────
  // PROMO FORM (shared between create + edit modal)
  // ─────────────────────────────────────────────────────────
  const LegacyPromoForm = () => (
    <form onSubmit={handlePromoSubmit} className="grid gap-6 p-8">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {promoModal === "edit" ? "Edit Promo Banner" : "Add Promo Banner"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">Manage homepage promotional banners</p>
      </div>

      <div className="relative ">
        <label className={labelCls}>Banner Title</label>
        <input
          type="text"
          value={promoForm.title}
          onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
          className={inputCls}
          required
        />
      </div>

      <div className="relative">
        <label className={labelCls}>Image URL</label>
        <input
          type="text"
          value={promoForm.image}
          onChange={(e) => setPromoForm({ ...promoForm, image: e.target.value })}
          className={inputCls}
          placeholder="https://..."
        />
      </div>

      <div className="relative">
        <label className={labelCls}>Upload Image (overrides URL)</label>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800 p-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPromoForm({ ...promoForm, imageFile: e.target.files[0] })}
            className="w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-600"
          />
        </div>
        {promoForm.imageFile && (
          <p className="mt-2 text-sm text-emerald-400">Selected: {promoForm.imageFile.name}</p>
        )}
      </div>

      {/* Preview */}
      {(promoForm.image || promoForm.imageFile) && (
        <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900">
          <div className="h-48 overflow-hidden">
            <img src={previewUrl || promoForm.image} alt="Banner preview" className="h-full w-full object-cover" />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-bold text-white">{promoForm.title || "Banner Preview"}</h3>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="rounded-2xl bg-white px-5 py-4 text-lg font-bold text-black transition hover:bg-emerald-500 hover:text-white"
      >
        {promoModal === "edit" ? "Save Changes" : "Create Banner"}
      </button>
    </form>
  );

  // ─────────────────────────────────────────────────────────
  // RUSH FORM (shared between create + edit modal)
  // ─────────────────────────────────────────────────────────
  const LegacyRushForm = () => (
    <form onSubmit={handleRushSubmit} className="grid gap-6 p-8">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {rushModal === "edit" ? "Edit Rush Deal" : "Create Rush Deal"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">Configure flash discounts and limited offers</p>
      </div>

      {/* Restaurant + dish — only shown on create */}
      {rushModal === "create" && (
        <>
          <div className="relative">
            <label className={labelCls}>Restaurant</label>
            <select
              value={rushForm.restaurant_id}
              onChange={(e) => {
                setRushForm({ ...rushForm, restaurant_id: e.target.value, menuItem: "" });
                setSelectedItemPrice(0);
                fetchRestaurantMenu(e.target.value);
              }}
              className={inputCls}
              required
            >
              <option value="">Select Restaurant</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className={labelCls}>Dish</label>
            <select
              value={rushForm.menuItem}
              onChange={(e) => {
                const sel = menuItems.find((m) => m._id === e.target.value);
                setSelectedItemPrice(sel?.price || 0);
                setRushForm({ ...rushForm, menuItem: e.target.value, discountPrice: sel?.price || "", discountPercent: 0 });
              }}
              className={inputCls}
              required
            >
              <option value="">Select Dish</option>
              {menuItems.map((m) => (
                <option key={m._id} value={m._id}>{m.name} — ₹{m.price}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* On edit — show item name read-only */}
      {rushModal === "edit" && editingDeal && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <p className="text-xs text-slate-400 mb-1">Item</p>
          <p className="text-white font-semibold">{editingDeal.itemName}</p>
        </div>
      )}

      {/* Original price */}
      {selectedItemPrice > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Original Price</p>
          <h3 className="mt-1 text-3xl font-bold text-white">₹{selectedItemPrice}</h3>
        </div>
      )}

      {/* Discount inputs */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="relative">
          <label className={labelCls}>Final Price (₹)</label>
          <input
            type="number"
            value={rushForm.discountPrice}
            onChange={(e) => {
              const val = Number(e.target.value);
              const pct = selectedItemPrice > 0
                ? Math.round(((selectedItemPrice - val) / selectedItemPrice) * 100)
                : 0;
              setRushForm({ ...rushForm, discountPrice: val, discountPercent: pct });
            }}
            className={inputCls}
          />
        </div>
        <div className="relative">
          <label className={labelCls}>Discount %</label>
          <input
            type="number"
            value={rushForm.discountPercent}
            onChange={(e) => {
              const pct = Number(e.target.value);
              const fp = selectedItemPrice > 0
                ? Math.round(selectedItemPrice * (1 - pct / 100))
                : 0;
              setRushForm({ ...rushForm, discountPercent: pct, discountPrice: fp });
            }}
            className={inputCls}
          />
        </div>
      </div>

      {/* Savings */}
      {selectedItemPrice > 0 && rushForm.discountPrice > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm text-slate-300">Customer Saves</p>
          <h3 className="mt-1 text-2xl font-bold text-emerald-400">
            ₹{selectedItemPrice - rushForm.discountPrice}
          </h3>
        </div>
      )}

      {/* Expiry */}
      <div className="relative">
        <label className={labelCls}>Deal Expiry</label>
        <input
          type="datetime-local"
          value={rushForm.endsAt}
          onChange={(e) => setRushForm({ ...rushForm, endsAt: e.target.value })}
          className={`${inputCls} [color-scheme:dark]`}
        />
      </div>

      <button
        type="submit"
        className="rounded-2xl bg-white px-5 py-4 text-lg font-bold text-black transition hover:bg-emerald-500 hover:text-white"
      >
        {rushModal === "edit" ? "Save Changes" : "Create Rush Deal"}
      </button>
    </form>
  );

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <PermissionGuard resource="banners" operation="view">

      <div className="space-y-8     animate-in
    fade-in
    duration-500">

        {/* HEADER */}
        <div className={`${panelClass} p-6 flex flex-col md:flex-row gap-6 md:items-center md:justify-between`}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Banner Management</h1>
            <p className="mt-2 text-sm text-slate-500">Manage promotional banners and active rush deals.</p>
          </div>
          {activeTab === "promo" ? (
            <button
              onClick={() => { setPromoForm(emptyPromo); setPromoModal("create"); }}
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow hover:bg-emerald-600 transition"
            >
              + Add Promo Banner
            </button>
          ) : (
            <button
              onClick={() => { setRushForm(emptyRush); setSelectedItemPrice(0); setRushModal("create"); }}
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow hover:bg-emerald-600 transition"
            >
              + Add Rush Deal
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-3">
          {["promo", "rush"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-xl border px-5 py-2 font-medium transition-all ${activeTab === t
                  ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                }`}
            >
              {t === "promo" ? "Promo Banners" : "Rush Deals"}
            </button>
          ))}
        </div>

        {/* ── PROMO BANNERS ─────────────────────────────────── */}
        {activeTab === "promo" && (
          // <div className="space-y-5">
          <div
            className="
    space-y-5
    animate-in
    fade-in
    slide-in-from-bottom-2
    duration-300
  "
          >
            {promoBanners.length === 0 ? (
              <p className="text-slate-400">No banners yet. Click "+ Add Promo Banner" to create one.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {promoBanners.map((banner) => {
                  const imageUrl = banner.image || `${API_URL}/banners/image/${banner._id}`;
                  return (
                    <div
                      key={banner._id}
                      className={`overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(249,115,22,0.12)] text-slate-900 ${!banner.isActive ? "opacity-50" : ""}`}
                    >
                      <div className="h-48 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={banner.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="text-lg font-bold text-slate-900">{banner.title}</h3>

                        {/* Active toggle + actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Toggle
                              checked={!!banner.isActive}
                              onChange={() => toggleBannerActive(banner)}
                              loading={togglingId === banner._id}
                            />
                            <span className="text-xs text-slate-500 font-medium">
                              {banner.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditPromo(banner)}
                              className="group flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] shadow-sm hover:shadow-md"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                              Edit
                            </button>
                            <button
                              onClick={() => deletePromoBanner(banner)}
                              className="group flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:text-red-650 hover:border-red-200 hover:bg-red-50/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] shadow-sm hover:shadow-md"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── RUSH DEALS ────────────────────────────────────── */}
        {activeTab === "rush" && (
          <div className="space-y-6">
            {activeDeals.length === 0 ? (
              <p className="text-slate-400">No active deals. Click "+ Add Rush Deal" to create one.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {activeDeals.map((deal) => (
                  <DealCard
                    key={deal._id}
                    deal={deal}
                    onDelete={deleteRushDeal}
                    onEdit={openEditDeal}
                    onToggle={toggleDealActive}
                    toggling={togglingId === deal._id}
                  />
                ))}
              </div>
            )}

            {expiredDeals.length > 0 && (
              <Collapsible title="Previous / Expired Deals" count={expiredDeals.length}>
                <div className="grid gap-5 pt-2 md:grid-cols-2">
                  {expiredDeals.map((deal) => (
                    <DealCard
                      key={deal._id}
                      deal={deal}
                      onDelete={deleteRushDeal}
                      onEdit={openEditDeal}
                      onToggle={toggleDealActive}
                      toggling={togglingId === deal._id}
                      expired
                    />
                  ))}
                </div>
              </Collapsible>
            )}
          </div>
        )}

        {/* ── MODALS ────────────────────────────────────────── */}
        {promoModal && (
          <Modal onClose={() => { setPromoModal(null); setEditingPromo(null); }}>
            <StablePromoForm
              promoModal={promoModal}
              promoForm={promoForm}
              setPromoForm={setPromoForm}
              handlePromoSubmit={handlePromoSubmit}
              previewUrl={previewUrl}
            />
          </Modal>
        )}

        {rushModal && (
          <Modal onClose={() => { setRushModal(null); setEditingDeal(null); setSelectedItemPrice(0); }}>
            <StableRushForm
              rushModal={rushModal}
              rushForm={rushForm}
              setRushForm={setRushForm}
              restaurants={restaurants}
              menuItems={menuItems}
              selectedItemPrice={selectedItemPrice}
              setSelectedItemPrice={setSelectedItemPrice}
              fetchRestaurantMenu={fetchRestaurantMenu}
              editingDeal={editingDeal}
              handleRushSubmit={handleRushSubmit}
            />
          </Modal>
        )}

        {deleteConfirm && (
          <Modal size="max-w-md" onClose={() => setDeleteConfirm(null)}>
            <DeleteConfirmDialog
              item={deleteConfirm.item}
              type={deleteConfirm.type}
              onClose={() => setDeleteConfirm(null)}
              onConfirm={handleConfirmDelete}
            />
          </Modal>
        )}
      </div>
    </PermissionGuard>
  );
}

// ── Deal card ─────────────────────────────────────────────
function DealCard({ deal, onDelete, onEdit, onToggle, toggling, expired = false }) {
  return (
    <div className={`rounded-2xl p-5 space-y-4 transition-all duration-300 ease-out hover:-translate-y-1 ${expired ? "bg-slate-200/60 border border-slate-300/80 shadow-[0_4px_20px_rgba(15,23,42,0.02)] text-slate-500 hover:shadow-md" : "bg-white/70 text-slate-900 border border-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)]"} ${!deal.isActive ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-lg font-bold tracking-tight ${expired ? "text-slate-600 line-through" : "text-slate-900"}`}>{deal.itemName}</h3>
        {expired && (
          <span className="rounded-full bg-slate-300/60 border border-slate-400/20 px-2.5 py-0.5 text-xs font-semibold text-slate-600 shrink-0">Expired</span>
        )}
      </div>

      <div className="text-sm space-y-1">
        <p className="text-slate-500">Original: ₹{deal.oldPrice}</p>
        {!!deal.discountPrice && <p className={expired ? "text-slate-500 font-semibold" : "text-emerald-600 font-semibold"}>Deal Price: ₹{deal.discountPrice}</p>}
        {!!deal.discountPercent && <p className={expired ? "text-slate-500 font-semibold" : "text-emerald-600 font-semibold"}>{deal.discountPercent}% OFF</p>}
        <p className="text-slate-500 font-medium">
          {deal.endsAt
            ? `${expired ? "Ended" : "Ends"}: ${new Date(deal.endsAt).toLocaleString()}`
            : "No expiry"}
        </p>
      </div>

      {/* Toggle + buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Toggle
            checked={!!deal.isActive}
            onChange={() => onToggle(deal)}
            loading={toggling}
          />
          <span className="text-xs text-slate-500 font-medium">
            {deal.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(deal)}
            className="group flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] shadow-sm hover:shadow-md"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            Edit
          </button>
          <button
            onClick={() => onDelete(deal)}
            className="group flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] shadow-sm hover:shadow-md"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
