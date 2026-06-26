"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import RevenueChart, {
  type RevenuePoint,
} from "../../components/charts/RevenueChart";
import LineChartComp from "../../components/charts/LineChart";
import PieChartComp from "../../components/charts/PieChart";
import BarChartComp from "../../components/charts/BarChart";
import api from "../../lib/api";
import Loader from "../../components/ui/Loader";

type OverviewStats = {
  revenue: number;
  orders: number;
  newUsers: number;
  avgOrder: number;
};

type ChartData = {
  _id: string;
  count?: number;
  total?: number;
  value?: number;
};

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  trend: string;
  accent: "emerald" | "cyan" | "violet" | "amber";
  icon: ReactNode;
  startCounter?: boolean;
};

const pageClass =
  "relative -m-4 min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 p-4 text-slate-950 sm:-m-6 sm:p-6";

const shellClass =
  "relative z-10 mx-auto w-full max-w-7xl space-y-6";

const panelClass =
  "admin-reveal rounded-2xl border border-white/70 bg-white/65 shadow-[0_0_40px_rgba(15,23,42,0.08),0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl";

const chartPanelClass =
  `${panelClass} p-1 transition-colors duration-200 hover:bg-white/75 hover:border-white [&>div]:!rounded-2xl [&>div]:!border-white/70 [&>div]:!bg-white/70 [&>div]:!shadow-none [&_h3]:!text-slate-900 [&_p]:!text-slate-500`;

const formatCurrency = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

const accentClasses = {
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    trend: "text-emerald-700 bg-emerald-50 border-emerald-200",
    bar: "bg-emerald-500",
  },
  cyan: {
    icon: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    trend: "text-cyan-700 bg-cyan-50 border-cyan-200",
    bar: "bg-cyan-500",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700 ring-violet-200",
    trend: "text-violet-700 bg-violet-50 border-violet-200",
    bar: "bg-violet-500",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 ring-amber-200",
    trend: "text-amber-700 bg-amber-50 border-amber-200",
    bar: "bg-amber-500",
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

function StatCard({
  title,
  value,
  subtitle,
  trend,
  accent,
  icon,
  startCounter = false,
}: StatCardProps) {
  const tone = accentClasses[accent];

  const initialValueText = String(value);

  const [displayValue, setDisplayValue] = useState<string | number>(
    initialValueText.charAt(0) === "₹" ? "₹0" : 0
  );

  useEffect(() => {
    const valueText = String(value);
    const isCurrency = valueText.charAt(0) === "₹";
    const target = Number(valueText.replace(/[^0-9.-]/g, "")) || 0;

    if (!startCounter) {
      setDisplayValue(isCurrency ? "₹0" : 0);
      return;
    }

    const counter = { current: 0 };

    const tween = gsap.to(counter, {
      current: target,
      duration: 0.9,
      ease: "power3.out",
      onUpdate: () => {
        const rounded = Math.round(counter.current).toLocaleString("en-IN");
        setDisplayValue(isCurrency ? `₹${rounded}` : rounded);
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, startCounter]);

  return (
    <div className="admin-reveal group relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-5 pl-6 shadow-[0_0_34px_rgba(15,23,42,0.08),0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-colors duration-200 hover:border-white hover:bg-white/85">
      <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full ${tone.bar}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
            {displayValue}
          </h2>
        </div>

        <div className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${tone.icon}`}>
          {icon}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {subtitle}
        </p>

        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.trend}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [orders, setOrders] = useState<ChartData[]>([]);
  const [orderStatus, setOrderStatus] = useState<ChartData[]>([]);
  const [topRestaurants, setTopRestaurants] = useState<ChartData[]>([]);
  const [topItems, setTopItems] = useState<ChartData[]>([]);
  const [usersGrowth, setUsersGrowth] = useState<ChartData[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [countersReady, setCountersReady] = useState(false);

  const dashboardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setCountersReady(false);
        setError("");

        const [
          statsRes,
          revenueRes,
          ordersRes,
          statusRes,
          restaurantsRes,
          itemsRes,
          usersRes,
        ] = await Promise.all([
          api.get<OverviewStats>("/admin/stats/overview"),
          api.get<RevenuePoint[]>("/admin/stats/revenue"),
          api.get<ChartData[]>("/admin/stats/orders"),
          api.get<ChartData[]>("/admin/stats/status"),
          api.get<ChartData[]>("/admin/stats/top-restaurants"),
          api.get<ChartData[]>("/admin/stats/top-items"),
          api.get<ChartData[]>("/admin/stats/users-growth"),
        ]);

        setStats(statsRes.data);
        setRevenue(revenueRes.data);
        setOrders(ordersRes.data);
        setOrderStatus(statusRes.data);
        setTopRestaurants(restaurantsRes.data);
        setTopItems(itemsRes.data);
        setUsersGrowth(usersRes.data);
      } catch {
        setError("Could not load dashboard analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;

    const root = dashboardRef.current;
    if (!root) return;

    setCountersReady(false);

    const ctx = gsap.context(() => {
      const nodes = gsap.utils.toArray<HTMLElement>(".admin-reveal");

      if (!nodes.length) {
        setCountersReady(true);
        return;
      }

      gsap.fromTo(
        nodes,
        {
          autoAlpha: 0,
          y: 26,
          scale: 0.985,
          transformOrigin: "50% 100%",
          willChange: "transform, opacity",
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.52,
          stagger: 0.055,
          ease: "power3.out",
          clearProps: "willChange,transform,opacity,visibility",
          onComplete: () => setCountersReady(true),
        }
      );
    }, root);

    return () => ctx.revert();
  }, [loading, error, stats]);

  if (error) {
    return (
      <div className={pageClass} ref={dashboardRef}>
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] max-w-3xl items-center justify-center">
          <div className="admin-reveal w-full rounded-2xl border border-red-200 bg-white/75 p-7 shadow-[0_0_40px_rgba(15,23,42,0.08),0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
              Dashboard unavailable
            </p>

            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Analytics could not be loaded
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl border border-slate-200 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Retry dashboard sync
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const statCards: StatCardProps[] = [
    {
      title: "Revenue",
      value: formatCurrency(stats.revenue),
      subtitle: "Gross platform revenue",
      trend: "Indexed",
      accent: "emerald",
      icon: (
        <MetricIcon>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15l3-3 3 2 5-7" />
        </MetricIcon>
      ),
    },
    {
      title: "Orders",
      value: stats.orders,
      subtitle: "Total order volume",
      trend: "Live",
      accent: "cyan",
      icon: (
        <MetricIcon>
          <path d="M6 2l1.5 4h9L18 2" />
          <path d="M4 6h16l-1.5 14h-13L4 6z" />
          <path d="M9 11h6" />
        </MetricIcon>
      ),
    },
    {
      title: "New Users",
      value: stats.newUsers,
      subtitle: "Recently acquired users",
      trend: "Growth",
      accent: "violet",
      icon: (
        <MetricIcon>
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="4" />
          <path d="M19 8v6" />
          <path d="M22 11h-6" />
        </MetricIcon>
      ),
    },
    {
      title: "Avg Order",
      value: formatCurrency(stats.avgOrder),
      subtitle: "Average basket value",
      trend: "AOV",
      accent: "amber",
      icon: (
        <MetricIcon>
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
        </MetricIcon>
      ),
    },
  ];

  return (
    <div className={pageClass} ref={dashboardRef}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(16,185,129,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,185,129,.12) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <div className={shellClass}>
        <section className={`${panelClass} overflow-hidden p-6 md:p-7`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live analytics
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Admin Command Center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Real-time platform intelligence for revenue, order flow, customer growth, and restaurant performance.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-white/90 px-5 py-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.10)] ring-1 ring-emerald-100/70 md:text-right">
              <div className="mb-1 flex items-center gap-2 md:justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/80">
                  Status
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-900">
                Operational dashboard synced
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard
              key={card.title}
              {...card}
              startCounter={countersReady}
            />
          ))}
        </section>

        <section className="space-y-6">
          <div className={`${chartPanelClass} xl:col-span-2`}>
            <RevenueChart data={revenue} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className={chartPanelClass}>
              <LineChartComp
                data={orders}
                dataKey="count"
                title="Orders Over Time"
                subtitle="Daily order count"
              />
            </div>

            <div className={chartPanelClass}>
              <PieChartComp
                data={orderStatus}
                title="Order Status Distribution"
                subtitle="Orders by status"
              />
            </div>

            <div className={chartPanelClass}>
              <BarChartComp
                data={topRestaurants}
                title="Top Restaurants"
                subtitle="By total revenue"
              />
            </div>

            <div className={chartPanelClass}>
              <BarChartComp
                data={topItems}
                title="Top Items"
                subtitle="By quantity ordered"
              />
            </div>

            <div className={`${chartPanelClass} xl:col-span-2`}>
              <LineChartComp
                data={usersGrowth}
                dataKey="count"
                title="User Growth"
                subtitle="Daily new users"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}