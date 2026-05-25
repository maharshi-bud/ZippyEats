"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

const API_URL = api.defaults.baseURL || "http://localhost:5010/api";

// ── Modal ─────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    
    // <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-[#081028] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-red-500 hover:text-white transition"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ── Collapsible ───────────────────────────────────────────
function Collapsible({ title, count, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/40 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold text-slate-300">
          {title}
          {count > 0 && (
            <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
              {count}
            </span>
          )}
        </span>
        <span className="text-slate-400 text-lg">{open ? "−" : "+"}</span>
      </button>
     <div
  className={`
    overflow-hidden
    transition-all
    duration-300
    ${
      open
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-green-500" : "bg-slate-600"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all duration-300 ease-out ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const inputCls =
  "w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white outline-none transition focus:border-orange-500";
const labelCls =
  "absolute -top-2.5 left-3 z-10 px-2 text-xs font-semibold text-orange-400";

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
            className="w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-orange-600"
          />
        </div>
        {promoForm.imageFile && (
          <p className="mt-2 text-sm text-emerald-400">Selected: {promoForm.imageFile.name}</p>
        )}
      </div>

      {previewImage && (
        <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900">
          <div
            className="h-48 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${previewImage})` }}
          />
          <div className="p-4">
            <h3 className="text-lg font-bold text-white">{promoForm.title || "Banner Preview"}</h3>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="rounded-2xl bg-white px-5 py-4 text-lg font-bold text-black transition hover:bg-orange-500 hover:text-white"
      >
        {promoModal === "edit" ? "Save Changes" : "Create Banner"}
      </button>
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
    <form onSubmit={handleRushSubmit} className="grid gap-6 p-8">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {rushModal === "edit" ? "Edit Rush Deal" : "Create Rush Deal"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">Configure flash discounts and limited offers</p>
      </div>

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
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <p className="text-xs text-slate-400 mb-1">Item</p>
          <p className="text-white font-semibold">{editingDeal.itemName}</p>
        </div>
      )}

      {selectedItemPrice > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Original Price</p>
          <h3 className="mt-1 text-3xl font-bold text-white">Rs.{selectedItemPrice}</h3>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
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

      {selectedItemPrice > 0 && rushForm.discountPrice > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm text-slate-300">Customer Saves</p>
          <h3 className="mt-1 text-2xl font-bold text-emerald-400">
            Rs.{selectedItemPrice - rushForm.discountPrice}
          </h3>
        </div>
      )}

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
        className="rounded-2xl bg-white px-5 py-4 text-lg font-bold text-black transition hover:bg-orange-500 hover:text-white"
      >
        {rushModal === "edit" ? "Save Changes" : "Create Rush Deal"}
      </button>
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
      try { const r = await api.get("/banners"); setPromoBanners(r.data.data || []); } catch {}
    }
  };

  const fetchRushDeals = async () => {
    try {
      const r = await api.get("/admin/rush-deals");
      setRushDeals(r.data.data || []);
    } catch {
      try { const r = await api.get("/rush-deals"); setRushDeals(r.data.data || []); } catch {}
    }
  };

  const fetchRestaurants = async () => {
    try { const r = await api.get("/restaurants"); setRestaurants(r.data.data || []); } catch {}
  };

  const fetchRestaurantMenu = async (id) => {
    try { const r = await api.get(`/restaurant/${id}`); setMenuItems(r.data.data.menu || []); } catch {}
  };

  // ── Splits ───────────────────────────────────────────────
  const now = new Date();
  const activeDeals  = rushDeals.filter((d) => !d.endsAt || new Date(d.endsAt) > now);
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
          discountPrice:   rushForm.discountPrice,
          discountPercent: rushForm.discountPercent,
          endsAt:          rushForm.endsAt,
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
  const deletePromoBanner = async (id) => {
    try { await api.delete(`/admin/banners/${id}`); fetchPromoBanners(); } catch {}
  };
  const deleteRushDeal = async (id) => {
    try { await api.delete(`/admin/rush-deals/${id}`); fetchRushDeals(); } catch {}
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
            className="w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-orange-600"
          />
        </div>
        {promoForm.imageFile && (
          <p className="mt-2 text-sm text-emerald-400">Selected: {promoForm.imageFile.name}</p>
        )}
      </div>

      {/* Preview */}
      {(promoForm.image || promoForm.imageFile) && (
        <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900">
          <div
            className="h-48 w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${previewUrl || promoForm.image})`,
            }}
          />
          <div className="p-4">
            <h3 className="text-lg font-bold text-white">{promoForm.title || "Banner Preview"}</h3>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="rounded-2xl bg-white px-5 py-4 text-lg font-bold text-black transition hover:bg-orange-500 hover:text-white"
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
        className="rounded-2xl bg-white px-5 py-4 text-lg font-bold text-black transition hover:bg-orange-500 hover:text-white"
      >
        {rushModal === "edit" ? "Save Changes" : "Create Rush Deal"}
      </button>
    </form>
  );

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8     animate-in
    fade-in
    duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Banner Management</h1>
          <p className="mt-1 text-slate-400">Manage promo banners and rush deals</p>
        </div>
        {activeTab === "promo" ? (
          <button
            onClick={() => { setPromoForm(emptyPromo); setPromoModal("create"); }}
            className="rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white shadow hover:bg-orange-600 transition"
          >
            + Add Promo Banner
          </button>
        ) : (
          <button
            onClick={() => { setRushForm(emptyRush); setSelectedItemPrice(0); setRushModal("create"); }}
            className="rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white shadow hover:bg-orange-600 transition"
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
            className={`rounded-xl border px-5 py-2 font-medium transition-all ${
              activeTab === t
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
                    className={`overflow-hidden rounded-2xl
bg-slate-900
transition-all
duration-300
hover:-translate-y-1
hover:scale-[1.01]
hover:shadow-2xl
hover:shadow-orange-500/10 text-white transition ${
                      !banner.isActive ? "opacity-50" : ""
                    }`}
                  >
                    <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
                    <div className="p-4 space-y-3">
                      <h3 className="text-lg font-semibold">{banner.title}</h3>

                      {/* Active toggle + actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={!!banner.isActive}
                            onChange={() => toggleBannerActive(banner)}
                            loading={togglingId === banner._id}
                          />
                          <span className="text-xs text-slate-400">
                            {banner.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditPromo(banner)}
                            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600 transition"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deletePromoBanner(banner._id)}
                            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium hover:bg-red-600 transition"
                          >
                            🗑️ Delete
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
    </div>
  );
}

// ── Deal card ─────────────────────────────────────────────
function DealCard({ deal, onDelete, onEdit, onToggle, toggling, expired = false }) {
  return (
    <div className={`rounded-2xl p-5 space-y-3 transition-all
duration-300
hover:-translate-y-1
hover:scale-[1.01]
hover:shadow-2xl
hover:shadow-orange-500/10 ${expired ? "bg-slate-800/50" : "bg-slate-900"} ${!deal.isActive ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">{deal.itemName}</h3>
        {expired && (
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400 shrink-0">Expired</span>
        )}
      </div>

      <div className="text-sm space-y-0.5">
        <p className="text-slate-400">Original: ₹{deal.oldPrice}</p>
        {!!deal.discountPrice && <p className="text-green-400">Deal Price: ₹{deal.discountPrice}</p>}
        {!!deal.discountPercent && <p className="text-orange-400">{deal.discountPercent}% OFF</p>}
        <p className="text-slate-500">
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
          <span className="text-xs text-slate-400">
            {deal.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(deal)}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600 transition text-white"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(deal._id)}
            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium hover:bg-red-600 transition text-white"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}
