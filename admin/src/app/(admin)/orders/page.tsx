"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import CustomSelect from "../../../components/ui/CustomSelect";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import PermissionGuard from "../../../components/PermissionGuard";
import api from "../../../lib/api";
import Loader from "../../../components/ui/Loader";

type ApiErrorBody = {
  message?: string;
};

type OrderStats = {
  total: number;
  placed: number;
  delivered: number;
  cancelled: number;
  accepted: number;
  preparing: number;
  out_for_delivery: number;
};

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
  veg?: boolean;
};

type OrderRow = {
  _id: string;
  user_id?: {
    name?: string;
  };
  restaurant?: {
    name?: string;
  };
  restaurant_name?: string;
  status: string;
  payment_method?: "cod" | "upi" | "card" | string;
  payment_status?: "pending" | "paid" | "failed" | string;
  subtotal?: number;
  delivery_fee?: number;
  tax_amount?: number;
  total_amount: number;
  coupon_code?: string | null;
  coupon_discount?: number;
  coupon_cashback?: number;
  coins_used?: number;
  coins_discount?: number;
  items?: OrderItem[];
  delivery_address?: {
    full_name?: string;
    phone?: string;
    address_line?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  eta?: string;
  createdAt: string;
};

type StatCardProps = {
  title: string;
  value: number;
  subtitle: string;
  accent: "emerald" | "cyan" | "amber" | "red";
  icon: ReactNode;
  startCounter?: boolean;
};

const panelClass =
  "orders-reveal rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl";

const inputClass =
  "rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500";

const accentClasses = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bar: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cyan: {
    icon: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    bar: "bg-cyan-500",
    pill: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 ring-amber-200",
    bar: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
  },
  red: {
    icon: "bg-red-50 text-red-700 ring-red-200",
    bar: "bg-red-500",
    pill: "bg-red-50 text-red-700 border-red-200",
  },
};

const statusStyles: Record<string, string> = {
  placed: "bg-slate-100 text-slate-700 border-slate-200",
  accepted: "bg-cyan-50 text-cyan-700 border-cyan-200",
  preparing: "bg-amber-50 text-amber-700 border-amber-200",
  out_for_delivery: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const paymentStatusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const formatStatus = (value?: string) =>
  value
    ?.replaceAll("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase()) || "Unknown";

const formatCurrency = (value?: number) =>
  `₹${Math.round(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function MetricIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function StatCard({ title, value, subtitle, accent, icon, startCounter = false }: StatCardProps) {
  const tone = accentClasses[accent];
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!startCounter) {
      setDisplayValue(0);
      return;
    }

    const counter = { current: 0 };
    const tween = gsap.to(counter, {
      current: value || 0,
      duration: 0.75,
      ease: "power3.out",
      onUpdate: () => setDisplayValue(Math.round(counter.current)),
    });

    return () => {
      tween.kill();
    };
  }, [value, startCounter]);

  return (
    <div className="orders-reveal group relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-5 pl-6 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-colors duration-200 hover:border-white hover:bg-white/85">
      <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full ${tone.bar}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {title}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
            {displayValue.toLocaleString("en-IN")}
          </h2>
        </div>

        <div className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${tone.icon}`}>
          {icon}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{subtitle}</p>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.pill}`}>
          Live
        </span>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();

  const [stats, setStats] = useState<OrderStats | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [hasCoupon, setHasCoupon] = useState("");
  const [hasCoins, setHasCoins] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countersReady, setCountersReady] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const advancedFiltersRef = useRef<HTMLDivElement | null>(null);

  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const inProcess =
    (stats?.placed ?? 0) +
    (stats?.accepted ?? 0) +
    (stats?.preparing ?? 0) +
    (stats?.out_for_delivery ?? 0);

  const hasActiveFilters = Boolean(
    status ||
    paymentMethod ||
    paymentStatus ||
    city ||
    search ||
    hasCoupon ||
    hasCoins ||
    minAmount ||
    maxAmount ||
    from ||
    to ||
    sortBy !== "createdAt" ||
    sort !== "desc"
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setCountersReady(false);
      setError("");

      const statsRes = await api.get("/admin/stats/orders-summary");

      const ordersRes = await api.get("/admin/stats/get-orderData", {
        params: {
          status: status || undefined,
          payment_method: paymentMethod || undefined,
          payment_status: paymentStatus || undefined,
          city: city || undefined,
          search: search.trim() || undefined,
          hasCoupon: hasCoupon || undefined,
          hasCoins: hasCoins || undefined,
          minAmount: minAmount || undefined,
          maxAmount: maxAmount || undefined,
          from: from || undefined,
          to: to || undefined,
          sortBy,
          sort,
          page,
          limit,
        },
      });

      setStats(statsRes.data);
      setOrders(ordersRes.data.orders || []);
      setTotal(ordersRes.data.total || 0);
    } catch (err: unknown) {
      const apiError = err as AxiosError<ApiErrorBody>;
      const message =
        apiError.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to load orders");

      setError(message);
      setStats({
        total: 0,
        placed: 0,
        delivered: 0,
        cancelled: 0,
        accepted: 0,
        preparing: 0,
        out_for_delivery: 0,
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [
    status,
    paymentMethod,
    paymentStatus,
    city,
    search,
    hasCoupon,
    hasCoins,
    minAmount,
    maxAmount,
    from,
    to,
    sortBy,
    sort,
    page,
  ]);

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, sortBy]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    if (loading) return;
    const root = pageRef.current;
    if (!root) return;

    setCountersReady(false);

    const ctx = gsap.context(() => {
      const nodes = gsap.utils.toArray<HTMLElement>(".orders-reveal");
      if (!nodes.length) {
        setCountersReady(true);
        return;
      }

      gsap.fromTo(
        nodes,
        {
          autoAlpha: 0,
          y: 24,
          scale: 0.985,
          transformOrigin: "50% 100%",
          willChange: "transform, opacity",
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.46,
          stagger: 0.05,
          ease: "power3.out",
          clearProps: "willChange,transform,opacity,visibility",
          onComplete: () => setCountersReady(true),
        }
      );
    }, root);

    return () => ctx.revert();
  }, [loading, error, stats, orders.length]);

  const resetFilters = () => {
    setStatus("");
    setPaymentMethod("");
    setPaymentStatus("");
    setCity("");
    setSearch("");
    setHasCoupon("");
    setHasCoins("");
    setMinAmount("");
    setMaxAmount("");
    setFrom("");
    setTo("");
    setSortBy("createdAt");
    setSort("desc");
    setPage(1);
  };

  const goToPage = () => {
    const next = Number(pageInput);
    if (!Number.isFinite(next)) return;
    const clamped = Math.min(Math.max(Math.floor(next), 1), totalPages);
    setPage(clamped);
    setPageInput(String(clamped));
  };

  const isInitialLoad = loading && !stats;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex justify-center pt-[30vh]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <PermissionGuard resource="orders" operation="view">
        <div className="space-y-4" ref={pageRef}>
          <div className={`${panelClass} p-6`}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
              Orders unavailable
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Could not load orders
            </h1>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => void fetchData()}
              className="mt-5 rounded-xl border border-slate-200 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard resource="orders" operation="view">
      <div className="space-y-6" ref={pageRef}>
        <section className={`${panelClass} overflow-hidden p-6 md:p-7`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live order feed
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Orders Control Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Monitor, filter, and manage customer orders across the platform.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-white/90 px-5 py-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.10)] ring-1 ring-emerald-100/70 md:text-right">
              <div className="mb-1 flex items-center gap-2 md:justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/80">
                  Showing
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {total.toLocaleString("en-IN")} matching orders
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={stats?.total || 0}
            subtitle="All platform orders"
            accent="emerald"
            startCounter={true}
            icon={
              <MetricIcon>
                <path d="M6 2l1.5 4h9L18 2" />
                <path d="M4 6h16l-1.5 14h-13L4 6z" />
                <path d="M9 11h6" />
              </MetricIcon>
            }
          />

          <StatCard
            title="In Process"
            value={inProcess}
            subtitle="Active fulfillment"
            accent="amber"
            startCounter={true}
            icon={
              <MetricIcon>
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" />
              </MetricIcon>
            }
          />

          <StatCard
            title="Delivered"
            value={stats?.delivered || 0}
            subtitle="Completed orders"
            accent="cyan"
            startCounter={true}
            icon={
              <MetricIcon>
                <path d="M20 6L9 17l-5-5" />
              </MetricIcon>
            }
          />

          <StatCard
            title="Cancelled"
            value={stats?.cancelled || 0}
            subtitle="Cancelled orders"
            accent="red"
            startCounter={true}
            icon={
              <MetricIcon>
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </MetricIcon>
            }
          />
        </section>

        <section className={`${panelClass} p-5 relative z-20`}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Filters
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Filter by status, payment, city, discounts, amount, date, and search terms.
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-fit rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Search & Filters Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                void fetchData();
              }}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ID, customer, phone, item, coupon..."
                  className={`${inputClass} flex-1`}
                />

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95"
                >
                  Search
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <CustomSelect
                    className="min-w-[200px]"
                    value={sortBy}
                    onChange={(val) => {
                      setPage(1);
                      setSortBy(val);
                    }}
                    options={[
                      { value: "createdAt", label: "Sort by created date" },
                      { value: "total_amount", label: "Sort by total amount" },
                      { value: "subtotal", label: "Sort by subtotal" },
                      { value: "delivery_fee", label: "Sort by delivery fee" },
                      { value: "eta", label: "Sort by ETA" },
                      { value: "status", label: "Sort by status" },
                      { value: "payment_status", label: "Sort by payment status" },
                      { value: "coins_used", label: "Sort by ZipCoins used" },
                      { value: "coupon_discount", label: "Sort by coupon discount" },
                    ]}
                  />

                  <CustomSelect
                    className="min-w-[150px]"
                    value={sort}
                    onChange={(val) => {
                      setPage(1);
                      setSort(val);
                    }}
                    options={[
                      { value: "desc", label: "Descending" },
                      { value: "asc", label: "Ascending" },
                    ]}
                  />

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${showAdvanced
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-300 ${showAdvanced ? "rotate-180" : ""
                        }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <span>Advanced Filters</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Advanced Filters Section */}
              <div
                ref={advancedFiltersRef}
                className={`transition-all duration-300 ease-in-out px-1 pb-1 -mx-1 -mb-1 ${showAdvanced ? "overflow-visible" : "overflow-hidden"}`}
                style={{
                  maxHeight: showAdvanced ? "1000px" : "0px",
                  opacity: showAdvanced ? 1 : 0,
                  marginTop: showAdvanced ? "0.5rem" : "0px",
                }}
              >
                <div className="border-t border-slate-100/80 pt-4 mt-2">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <CustomSelect
                      value={status}
                      onChange={(val) => setStatus(val)}
                      placeholder="All Status"
                      options={[
                        { value: "", label: "All Status" },
                        { value: "placed", label: "Placed" },
                        { value: "accepted", label: "Accepted" },
                        { value: "preparing", label: "Preparing" },
                        { value: "out_for_delivery", label: "Out for delivery" },
                        { value: "delivered", label: "Delivered" },
                        { value: "cancelled", label: "Cancelled" },
                      ]}
                    />

                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="City (e.g. Ahmedabad)"
                      className={inputClass}
                    />

                    <CustomSelect
                      value={paymentMethod}
                      onChange={(val) => setPaymentMethod(val)}
                      placeholder="All Payment Methods"
                      options={[
                        { value: "", label: "All Payment Methods" },
                        { value: "cod", label: "COD" },
                        { value: "upi", label: "UPI" },
                        { value: "card", label: "Card" },
                      ]}
                    />

                    <CustomSelect
                      value={paymentStatus}
                      onChange={(val) => setPaymentStatus(val)}
                      placeholder="All Payment Status"
                      options={[
                        { value: "", label: "All Payment Status" },
                        { value: "pending", label: "Pending" },
                        { value: "paid", label: "Paid" },
                        { value: "failed", label: "Failed" },
                      ]}
                    />

                    <CustomSelect
                      value={hasCoupon}
                      onChange={(val) => setHasCoupon(val)}
                      placeholder="Coupon: Any"
                      options={[
                        { value: "", label: "Coupon: Any" },
                        { value: "true", label: "With coupon" },
                        { value: "false", label: "No coupon" },
                      ]}
                    />

                    <CustomSelect
                      value={hasCoins}
                      onChange={(val) => setHasCoins(val)}
                      placeholder="ZipCoins: Any"
                      options={[
                        { value: "", label: "ZipCoins: Any" },
                        { value: "true", label: "Used ZipCoins" },
                        { value: "false", label: "No ZipCoins" },
                      ]}
                    />

                    <input
                      type="number"
                      value={minAmount}
                      onChange={(event) => setMinAmount(event.target.value)}
                      placeholder="Min amount"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(event) => setMaxAmount(event.target.value)}
                      placeholder="Max amount"
                      className={inputClass}
                    />

                    <div className="flex flex-col gap-1.5 pl-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From Date</span>
                      <input
                        type="date"
                        value={from}
                        onChange={(event) => setFrom(event.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 pl-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To Date</span>
                      <input
                        type="date"
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className={`${panelClass} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-white/70 bg-white/45 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Order Feed</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-sm">
              <thead className="bg-white/55 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Order</th>
                  <th className="px-5 py-4 text-left font-semibold">Customer</th>
                  <th className="px-5 py-4 text-left font-semibold">Restaurant</th>
                  <th className="px-5 py-4 text-left font-semibold">Items</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-left font-semibold">Payment</th>
                  <th className="px-5 py-4 text-left font-semibold">Subtotal</th>
                  <th className="px-5 py-4 text-left font-semibold">Discounts</th>
                  <th className="px-5 py-4 text-left font-semibold">Total</th>
                  <th className="px-5 py-4 text-left font-semibold">ETA / Created</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100/80 bg-white/35">
                {orders.map((order) => {
                  const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                  const itemPreview = order.items?.slice(0, 2).map((item) => item.name).filter(Boolean).join(", ");
                  const discountTotal =
                    (order.coupon_discount || 0) + (order.coins_discount || 0);

                  return (
                    <tr key={order._id} className="transition-colors hover:bg-white/70">
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-slate-900">#{order._id.slice(-8)}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{order._id}</p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="font-medium text-slate-800">
                          {order.delivery_address?.full_name || order.user_id?.name || "-"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {order.delivery_address?.phone || "No phone"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {order.delivery_address?.city || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top text-slate-700">
                        {order.restaurant?.name || order.restaurant_name || "-"}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="font-medium text-slate-800">{itemCount} item{itemCount === 1 ? "" : "s"}</p>
                        <p className="mt-0.5 max-w-[210px] truncate text-xs text-slate-500">
                          {itemPreview || "No item names"}
                          {(order.items?.length || 0) > 2 ? "…" : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status] || statusStyles.placed
                            }`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold uppercase text-slate-700">
                          {order.payment_method || "cod"}
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusStyles[order.payment_status || "pending"] ||
                            paymentStatusStyles.pending
                            }`}
                        >
                          {formatStatus(order.payment_status || "pending")}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-slate-700">
                        <p>{formatCurrency(order.subtotal)}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Fee {formatCurrency(order.delivery_fee)}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-slate-800">
                          {discountTotal > 0 ? `-${formatCurrency(discountTotal)}` : "—"}
                        </p>
                        <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                          {order.coupon_code && <p>🎟 {order.coupon_code}</p>}
                          {(order.coins_used || 0) > 0 && <p>🪙 {order.coins_used} coins</p>}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top font-semibold text-slate-950">
                        {formatCurrency(order.total_amount)}
                      </td>

                      <td className="px-5 py-4 align-top text-slate-500">
                        <p>ETA {formatDate(order.eta)}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right align-top">
                        <button
                          type="button"
                          onClick={() => router.push(`/order/${order._id}`)}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="border-t border-white/70 p-10 text-center">
              <p className="text-base font-semibold text-slate-800">No orders found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing the filters or sort order.
              </p>
            </div>
          )}
        </section>

        <section className={`${panelClass} p-4`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-slate-500">
              Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Previous
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5">
                <span className="pl-1 text-xs font-semibold text-slate-400">Go to</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") goToPage();
                  }}
                  className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-center text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={goToPage}
                  className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Go
                </button>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </PermissionGuard>
  );
}
