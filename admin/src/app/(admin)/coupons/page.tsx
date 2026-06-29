"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import CustomSelect from "../../../components/ui/CustomSelect";
import {
  Pencil,
  Trash2,
  Ticket,
  Activity,
  Percent,
  TrendingUp,
  Search,
} from "lucide-react";

import type {
  Coupon,
  DiscountType,
} from "../../../components/coupons/CouponForm";

interface FilteredCouponsData {
  totalCount: number;
  activeCount: number;
  totalRedeemed: number;
  totalUsageLimit: number;
}

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getStatusBadge(coupon: Coupon) {
  const now = Date.now();
  const from = coupon.validity?.start_date ? new Date(coupon.validity.start_date).getTime() : null;
  const till = coupon.validity?.end_date ? new Date(coupon.validity.end_date).getTime() : null;

  const scheduled = from !== null && from > now;
  const expired = till !== null && till < now;
  const usageLimit = coupon.limits?.total_usage_limit || 0;
  const usedCount = coupon.limits?.current_usage_count || 0;
  const exhausted = usageLimit > 0 && usedCount >= usageLimit;

  const active = Boolean(coupon.is_active) && !scheduled && !expired && !exhausted;

  if (active) {
    return {
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
      label: "Active",
    };
  }
  if (scheduled) {
    return {
      cls: "bg-amber-50 text-amber-700 border border-amber-200/60",
      label: "Scheduled",
    };
  }
  if (expired) {
    return {
      cls: "bg-red-50 text-red-700 border border-red-200/60",
      label: "Expired",
    };
  }
  if (exhausted) {
    return {
      cls: "bg-slate-100 text-slate-600 border border-slate-200",
      label: "Exhausted",
    };
  }
  return {
    cls: "bg-slate-100 text-slate-500 border border-slate-200",
    label: "Inactive",
  };
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function getDiscountLabel(coupon: Coupon) {
  if (coupon.reward?.type === "percentage") {
    return `${coupon.reward?.value || 0}% OFF`;
  }
  if (coupon.reward?.type === "flat") {
    return `${formatCurrency(coupon.reward?.value)} OFF`;
  }
  return "Free Delivery";
}

// ── Toggle Switch ─────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  loading?: boolean;
}

function Toggle({ checked, onChange, loading = false }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${
        checked ? "bg-emerald-500" : "bg-slate-200"
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

// ── Modal ─────────────────────────────────────────────────
interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  size?: string;
}

function Modal({ onClose, children, size = "max-w-4xl" }: ModalProps) {
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
interface DeleteConfirmDialogProps {
  item: Coupon;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmDialog({ item, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-100">
          <Trash2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Delete Coupon?</h3>
          <p className="text-sm text-slate-500">This action cannot be undone</p>
        </div>
      </div>

      <p className="text-slate-600 leading-relaxed text-sm">
        Are you sure you want to delete the coupon <span className="font-semibold text-slate-900">"{item.code}"</span>?
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-100 border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-650 hover:shadow-lg hover:shadow-red-500/10 transition-all cursor-pointer"
        >
          Delete Permanently
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold cursor-pointer shadow-sm hover:border-slate-300 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_fill=%22none%22_viewBox=%220_0_24_24%22%3E%3Cpath_stroke=%22%2394A3B8%22_stroke-linecap=%22round%22_stroke-linejoin=%22round%22_stroke-width=%222%22_d=%22m6_9_6_6_6-6%22/%3E%3C/svg%3E')] bg-[position:right_1.25rem_center] bg-no-repeat bg-[size:1.25em_auto] pr-12";

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Expired", value: "expired" },
  { label: "Exhausted", value: "exhausted" },
];

const typeOptions = [
  { label: "All Types", value: "all" },
  { label: "Percentage", value: "PERCENTAGE" },
  { label: "Flat Amount", value: "FLAT" },
  { label: "Free Delivery", value: "FREE_DELIVERY" },
];

export default function CouponsPage() {
  const router = useRouter();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "expired" | "scheduled" | "exhausted"
  >("all");

  const [typeFilter, setTypeFilter] = useState<"all" | DiscountType>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/coupons");
      setCoupons(unwrapList<Coupon>(res.data));
    } catch (err: any) {
      console.error("[CouponsPage] fetch:", err);
      setError(err?.response?.data?.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filteredCoupons = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const now = Date.now();
      const from = coupon.validity?.start_date ? new Date(coupon.validity.start_date).getTime() : null;
      const till = coupon.validity?.end_date ? new Date(coupon.validity.end_date).getTime() : null;

      const scheduled = from !== null && from > now;
      const expired = till !== null && till < now;
      const usageLimit = coupon.limits?.total_usage_limit || 0;
      const usedCount = coupon.limits?.current_usage_count || 0;
      const exhausted = usageLimit > 0 && usedCount >= usageLimit;

      const active = Boolean(coupon.is_active) && !scheduled && !expired && !exhausted;

      const rewardType =
        coupon.reward?.type === "percentage"
          ? "PERCENTAGE"
          : coupon.reward?.type === "flat"
          ? "FLAT"
          : "FREE_DELIVERY";

      const matchesQuery =
        !needle ||
        coupon.code?.toLowerCase().includes(needle) ||
        coupon.title?.toLowerCase().includes(needle) ||
        coupon.description?.toLowerCase().includes(needle);

      const matchesType = typeFilter === "all" || rewardType === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active && !expired && !scheduled && !exhausted) ||
        (statusFilter === "expired" && expired) ||
        (statusFilter === "scheduled" && scheduled) ||
        (statusFilter === "exhausted" && exhausted);

      return matchesQuery && matchesType && matchesStatus;
    });
  }, [coupons, query, statusFilter, typeFilter]);

  const stats: FilteredCouponsData = useMemo(() => {
    const totalRedeemed = coupons.reduce(
      (acc, item) => acc + (item.limits?.current_usage_count || 0),
      0
    );

    const totalUsageLimit = coupons.reduce(
      (acc, item) => acc + (item.limits?.total_usage_limit || 0),
      0
    );

    const activeCount = coupons.filter((coupon) => coupon.is_active).length;

    return {
      totalCount: coupons.length,
      activeCount,
      totalRedeemed,
      totalUsageLimit,
    };
  }, [coupons]);

  const toggleCoupon = (coupon: Coupon) => {
    setSaving(true);
    setError("");

    api
      .patch(`/admin/coupons/${coupon._id}/toggle`)
      .then(() => {
        setCoupons((prev) =>
          prev.map((item) =>
            item._id === coupon._id ? { ...item, is_active: !item.is_active } : item
          )
        );
      })
      .catch((err: any) => {
        console.error("[CouponsPage] toggle:", err);
        setError(err?.response?.data?.message || "Failed to toggle coupon.");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    setSaving(true);
    setError("");

    api
      .delete(`/admin/coupons/${deleteConfirm._id}`)
      .then(() => {
        setCoupons((prev) => prev.filter((item) => item._id !== deleteConfirm._id));
      })
      .catch((err: any) => {
        console.error("[CouponsPage] delete:", err);
        setError(err?.response?.data?.message || "Failed to delete coupon.");
      })
      .finally(() => {
        setSaving(false);
        setDeleteConfirm(null);
      });
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Promotion Center</h1>
          <p className="mt-1 text-sm text-slate-500">Create, manage and track coupon campaigns</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/coupons/new")}
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 shadow hover:shadow-md cursor-pointer"
        >
          + New Coupon
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
        {/* Total Coupons */}
        <div className="rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl p-5 border-l-4 border-l-blue-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Coupons</span>
            <Ticket className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{stats.totalCount}</h3>
          <p className="mt-1 text-[11px] text-slate-400">+4 created this month</p>
        </div>

        {/* Active Coupons */}
        <div className="rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl p-5 border-l-4 border-l-emerald-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
            <Activity className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{stats.activeCount}</h3>
          <p className="mt-1 text-[11px] text-slate-400">100% active campaigns live</p>
        </div>

        {/* Redeemed */}
        <div className="rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl p-5 border-l-4 border-l-orange-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Redeemed</span>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{stats.totalRedeemed}</h3>
          <p className="mt-1 text-[11px] text-slate-400">Across all orders</p>
        </div>

        {/* Capacity usage */}
        <div className="rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl p-5 border-l-4 border-l-indigo-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Capacity</span>
            <Percent className="h-5 w-5 text-indigo-500" />
          </div>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {stats.totalUsageLimit > 0
              ? `${Math.round((stats.totalRedeemed / stats.totalUsageLimit) * 100)}%`
              : "0%"}
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            {stats.totalRedeemed} / {stats.totalUsageLimit || "∞"} used
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="relative z-50 flex flex-col md:flex-row gap-4 p-5 rounded-2xl border border-white/70 bg-white/50 backdrop-blur-md shadow-sm items-center">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="absolute left-4 text-slate-400 h-4.5 w-4.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search coupons, codes, titles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 text-sm"
          />
        </div>

        <CustomSelect
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as any)}
          options={statusOptions}
          placeholder="All Status"
          theme="emerald"
          className="w-full md:w-48"
        />

        <CustomSelect
          value={typeFilter}
          onChange={(val) => setTypeFilter(val as any)}
          options={typeOptions}
          placeholder="All Types"
          theme="emerald"
          className="w-full md:w-48"
        />
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Coupons List - Table Style */}
      <div className="rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-slate-100/70 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Ticket className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No coupons found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or status filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCoupons.map((coupon) => {
              const statusBadge = getStatusBadge(coupon);
              const usedCount = coupon.limits?.current_usage_count || 0;
              const usageLimit = coupon.limits?.total_usage_limit || 0;

              return (
                <div
                  key={coupon._id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/50 transition-colors gap-4"
                >
                  {/* Left: Code, Title, Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold bg-indigo-50 border border-indigo-100/50 text-indigo-600 px-2.5 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{coupon.title || "Untitled Coupon"}</h4>
                    </div>
                    {coupon.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{coupon.description}</p>
                    )}
                  </div>

                  {/* Middle Indicators: Reward, Redeemed, Status */}
                  <div className="flex items-center gap-6 md:gap-12 flex-wrap">
                    {/* Discount Value */}
                    <div className="text-left md:text-center min-w-[100px]">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Discount</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{getDiscountLabel(coupon)}</h4>
                    </div>

                    {/* Redeemed */}
                    <div className="text-left md:text-center min-w-[100px]">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Redeemed</span>
                      <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                        {usedCount} <span className="text-slate-400 font-normal">/ {usageLimit > 0 ? usageLimit : "∞"}</span>
                      </h4>
                    </div>

                    {/* Status Badge */}
                    <div className="min-w-[100px] text-left md:text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusBadge.cls}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 md:pl-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/coupons/${coupon._id}/edit`)}
                      className="group flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] shadow-sm hover:shadow cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      Edit
                    </button>
                    <div className="flex items-center gap-2 px-1">
                      <Toggle
                        checked={!!coupon.is_active}
                        onChange={() => toggleCoupon(coupon)}
                        loading={saving}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(coupon)}
                      className="group flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:text-red-650 hover:border-red-200 hover:bg-red-50/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] shadow-sm hover:shadow cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <Modal size="max-w-md" onClose={() => setDeleteConfirm(null)}>
          <DeleteConfirmDialog
            item={deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={handleConfirmDelete}
          />
        </Modal>
      )}
    </div>
  );
}