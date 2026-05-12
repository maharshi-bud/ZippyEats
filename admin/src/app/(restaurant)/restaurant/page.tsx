"use client";

import { useEffect, useState } from "react";

import api from "../../../lib/api";

import {
  DollarSign,
  ShoppingBag,
  Star,
  TrendingUp,
  Clock3,
} from "lucide-react";



import RestaurantRevenueChart from "../../../components/charts/RestaurantRevenueChart";
import RestaurantPieChart from "../../../components/charts/RestaurantPieChart";
import RestaurantBarChart from "../../../components/charts/RestaurantBarChart";

export default function RestaurantDashboard() {
  const [range, setRange] = useState("daily");

  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<any>(
    null
  );

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        `/restaurant-owner/dashboard?range=${range}`
      );

      setDashboard(res.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-white text-xl">
        Loading Dashboard...
      </div>
    );
  }

  const stats = [
    {
      title: "Total Orders",
      value: dashboard.stats.totalOrders,
      icon: ShoppingBag,
    },
    {
      title: "Best Seller",
      value:
        dashboard.stats.bestSeller?.name ||
        "No Data",
      icon: TrendingUp,
    },
    {
      title: "Avg Order Amt",
      value: `₹${dashboard.stats.avgOrderAmount}`,
      icon: DollarSign,
    },
    {
      title: "Revenue",
      value: `₹${dashboard.stats.revenue}`,
      icon: Star,
    },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            Monitor restaurant performance and
            orders
          </p>
        </div>

        {/* FILTERS */}

        <div className="flex items-center gap-2 bg-[#151924] border border-white/10 rounded-2xl p-2">
          {[
            "daily",
            "monthly",
            "all",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`px-5 py-2 rounded-xl capitalize transition-all ${
                range === item
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE BADGE */}

      <div className="flex items-center gap-2 text-green-400 text-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />

        Live Orders Updating
      </div>

      {/* TOP STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-[#151924] border border-white/10 rounded-3xl p-6 hover:border-orange-500/30 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">
                    {item.title}
                  </p>

                  <h2 className="text-3xl font-bold text-white mt-3">
                    {item.value}
                  </h2>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center">
                  <Icon className="text-orange-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHART ROW 1 */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* PIE CHART */}

        <div className="bg-[#151924] border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock3 className="text-orange-400" />

            <h2 className="text-xl font-semibold text-white">
              Ongoing Orders Status
            </h2>
          </div>

          <div className="h-[320px]">
            <RestaurantPieChart
              data={dashboard.orderStatus}
            />
          </div>
        </div>

        {/* REVENUE CHART */}

        <div className="xl:col-span-2 bg-[#151924] border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-orange-400" />

            <h2 className="text-xl font-semibold text-white">
              Revenue Trend
            </h2>
          </div>

          <div className="h-[320px]">
            <RestaurantRevenueChart
              data={dashboard.revenueTrend}
            />
          </div>
        </div>
      </div>

      {/* CHART ROW 2 */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* PEAK HOURS */}

        <div className="bg-[#151924] border border-white/10 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Peak Hours
          </h2>

          <div className="h-[320px]">
            <RestaurantBarChart
              data={dashboard.peakHours}
            />
          </div>
        </div>

        {/* RATINGS */}

        <div className="bg-[#151924] border border-white/10 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Customer Ratings
          </h2>

          <div className="space-y-5">
            {dashboard.ratingsDistribution.map(
              (rating: any) => (
                <div
                  key={rating.stars}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">
                      {rating.stars}
                    </span>

                    <span className="text-orange-400">
                      {rating.count}
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-[#0f1117] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{
                        width: `${
                          (rating.count /
                            Math.max(
                              ...dashboard.ratingsDistribution.map(
                                (r: any) =>
                                  r.count
                              )
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>

          {/* AVG RATING */}

          <div className="mt-10 flex items-center justify-between bg-[#0f1117] rounded-2xl p-5">
            <div>
              <p className="text-gray-400 text-sm">
                Average Rating
              </p>

              <h3 className="text-3xl font-bold text-white mt-1">
                {dashboard.stats.avgRating}
              </h3>
            </div>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={22}
                  className="fill-orange-400 text-orange-400"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}