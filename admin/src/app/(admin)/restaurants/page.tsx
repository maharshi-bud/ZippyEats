"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import api from "../../../lib/api";
import Loader from "../../../components/ui/Loader";
import PermissionGuard from "../../../components/PermissionGuard";
import CustomSelect from "../../../components/ui/CustomSelect";
import type { AxiosError } from "axios";
import gsap from "gsap";

type ApiErrorBody = {
  message?: string;
};

const safe = (v: any) => Number(v) || 0;

// ==========================================
// SHARED STYLES & COMPONENTS
// ==========================================

type StatCardProps = {
  title: string;
  value: number;
  subtitle: string;
  accent: "emerald" | "cyan" | "amber" | "red" | "violet" | "blue";
  icon: ReactNode;
  startCounter?: boolean;
  prefix?: string;
};

const panelClass =
  "restaurants-reveal rounded-2xl border border-white/70 bg-white/70 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300";

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
  violet: {
    icon: "bg-violet-50 text-violet-700 ring-violet-200",
    bar: "bg-violet-500",
    pill: "bg-violet-50 text-violet-700 border-violet-200",
  },
  blue: {
    icon: "bg-blue-50 text-blue-700 ring-blue-200",
    bar: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border-blue-200",
  },
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

function StatCard({ title, value, subtitle, accent, icon, startCounter = false, prefix = "" }: StatCardProps) {
  const tone = accentClasses[accent] || accentClasses.emerald;
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
    <div className="restaurants-reveal group relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-5 pl-6 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-colors duration-200 hover:border-white hover:bg-white/85">
      <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full ${tone.bar}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {title}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
            {prefix}{displayValue.toLocaleString("en-IN")}
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

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);

  const [sortBy, setSortBy] = useState("totalRevenue");
  const [order, setOrder] = useState("desc");
  const [activeFilter, setActiveFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countersReady, setCountersReady] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/admin/stats/restaurants-list", {
          params: { sortBy, order, active: activeFilter },
        });

        setRestaurants(res.data || []);
      } catch (err: unknown) {
        const apiError = err as AxiosError<ApiErrorBody>;
        setError(apiError.response?.data?.message || "Failed to load restaurants");
      } finally {
        setLoading(false);
        setCountersReady(true);
      }
    };

    fetchData();
  }, [sortBy, order, activeFilter]);

  useEffect(() => {
    if (!loading && pageRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".restaurants-reveal",
          { opacity: 0, y: 15, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out",
          }
        );
      }, pageRef);
      return () => ctx.revert();
    }
  }, [loading]);

  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(restaurants.length / limit));
  const paginatedRestaurants = restaurants.slice((page - 1) * limit, page * limit);

  const goToPage = () => {
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
    } else {
      setPageInput(page.toString());
    }
  };

  const totalRevenue = restaurants.reduce((a, r) => a + safe(r.totalRevenue), 0);
  const totalItems = restaurants.reduce((a, r) => a + safe(r.totalItemsSold), 0);
  const activeCount = restaurants.filter((r) => r.isActive).length;

  if (loading && restaurants.length === 0)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <PermissionGuard resource="restaurants" operation="view">
      <div ref={pageRef} className="mx-auto max-w-7xl space-y-6 pb-20 p-2 md:p-4">
        
        {/* HEADER */}
        <section className={`${panelClass} p-5 md:p-8 relative z-30`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Restaurants Management
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Monitor performance and manage partner restaurants on your platform.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-white/90 px-5 py-4 text-left shadow-sm ring-1 ring-emerald-100/70 md:text-right">
              <div className="mb-1 flex items-center gap-2 md:justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/80">
                  Showing
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {restaurants.length.toLocaleString("en-IN")} matching restaurants
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STATS */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3 relative z-20">
          <StatCard
            title="Total Revenue"
            value={totalRevenue}
            prefix="₹"
            subtitle="Platform wide sales"
            accent="emerald"
            startCounter={countersReady}
            icon={
              <MetricIcon>
                <path d="M6 3h12" />
                <path d="M6 8h12" />
                <path d="m6 13 8.5 8" />
                <path d="M6 13h3" />
                <path d="M9 13c6.667 0 6.667-10 0-10" />
              </MetricIcon>
            }
          />

          <StatCard
            title="Items Sold"
            value={totalItems}
            subtitle="Total dishes ordered"
            accent="cyan"
            startCounter={countersReady}
            icon={
              <MetricIcon>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </MetricIcon>
            }
          />

          <StatCard
            title="Active Restaurants"
            value={activeCount}
            subtitle="Currently accepting orders"
            accent="amber"
            startCounter={countersReady}
            icon={
              <MetricIcon>
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
                <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
              </MetricIcon>
            }
          />
        </section>

        {/* FILTERS */}
        <section className={`${panelClass} p-5 relative z-10`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Filters & Sort
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Filter restaurants by activity or sort by revenue and items sold.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <CustomSelect
                className="min-w-[160px]"
                value={sortBy}
                onChange={(val) => {
                  setSortBy(val);
                  setPage(1);
                }}
                options={[
                  { value: "totalRevenue", label: "Sort by Revenue" },
                  { value: "totalItemsSold", label: "Sort by Items Sold" },
                ]}
              />

              <CustomSelect
                className="min-w-[150px]"
                value={order}
                onChange={(val) => {
                  setOrder(val);
                  setPage(1);
                }}
                options={[
                  { value: "desc", label: "High → Low" },
                  { value: "asc", label: "Low → High" },
                ]}
              />

              <CustomSelect
                className="min-w-[140px]"
                value={activeFilter}
                onChange={(val) => {
                  setActiveFilter(val);
                  setPage(1);
                }}
                placeholder="All Status"
                options={[
                  { value: "", label: "All Status" },
                  { value: "true", label: "Active Only" },
                  { value: "false", label: "Inactive Only" },
                ]}
              />
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section className={`${panelClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Restaurant</th>
                  <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                  <th className="px-6 py-4 font-semibold text-right">Items Sold</th>
                  <th className="px-6 py-4 font-semibold text-right">Avg Item</th>
                  <th className="px-6 py-4 font-semibold">Top Dish</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRestaurants.map((r) => (
                  <tr
                    key={r._id}
                    className="group transition-colors duration-200 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: {r._id.slice(-6)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
                        ₹{safe(r.totalRevenue).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {safe(r.totalItemsSold).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      ₹{safe(r.avgItemValue).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {r.topDish || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                          r.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}

                {restaurants.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-base font-medium text-slate-600">No restaurants found.</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Try adjusting your filters to find what you're looking for.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {loading && restaurants.length > 0 && (
             <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
               <Loader />
             </div>
          )}
        </section>

        {/* PAGINATION */}
        <section className={`${panelClass} p-4`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-slate-500">
              Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => {
                  setPage((prev) => Math.max(1, prev - 1));
                  setPageInput(String(Math.max(1, page - 1)));
                }}
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
                onClick={() => {
                  setPage((prev) => Math.min(totalPages, prev + 1));
                  setPageInput(String(Math.min(totalPages, page + 1)));
                }}
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