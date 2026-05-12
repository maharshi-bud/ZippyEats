"use client";

import { useEffect, useState } from "react";

import api from "../../../lib/api";

import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock3,
  Star,
} from "lucide-react";

import RestaurantRevenueChart from "../../../components/charts/RestaurantRevenueChart";
import RestaurantPieChart from "../../../components/charts/RestaurantPieChart";
import RestaurantBarChart from "../../../components/charts/RestaurantBarChart";

export default function RestaurantDashboard() {
  const [range, setRange] = useState("daily");

  const [dashboard, setDashboard] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

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
      <div className="flex h-[80vh] items-center justify-center text-2xl font-semibold text-gray-700">
        Loading Dashboard...
      </div>
    );
  }

  const stats = [
    {
      title: "Revenue",
      value: `₹${dashboard.stats.revenue}`,
      icon: DollarSign,
    },
    {
      title: "Orders",
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
      title: "Avg Order",
      value: `₹${dashboard.stats.avgOrderAmount}`,
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Restaurant Dashboard
          </h1>

          <p className="mt-1 text-gray-500">
            Monitor your restaurant
            performance
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border bg-white p-1 shadow-sm">
          {[
            "daily",
            "monthly",
            "all",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition ${
                range === item
                  ? "bg-green-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {item.title}
                  </p>

                  <h2 className="mt-3 text-4xl font-bold text-green-600">
                    {item.value}
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Icon className="text-green-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS ROW 1 */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              Revenue
            </h2>

            <p className="text-gray-500">
              Revenue trend overview
            </p>
          </div>

          <div className="h-[320px]">
            <RestaurantRevenueChart
              data={dashboard.revenueTrend}
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              Orders Over Time
            </h2>

            <p className="text-gray-500">
              Daily order count
            </p>
          </div>

          <div className="h-[320px]">
            <RestaurantBarChart
              data={dashboard.peakHours}
            />
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* PIE */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              Order Status Distribution
            </h2>

            <p className="text-gray-500">
              Orders by status
            </p>
          </div>

          <div className="flex h-[320px] items-center justify-center">
            <RestaurantPieChart
              data={dashboard.orderStatus}
            />
          </div>
        </div>

        {/* RATINGS */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              Customer Ratings
            </h2>

            <p className="text-gray-500">
              Ratings distribution
            </p>
          </div>

          <div className="space-y-5">
            {dashboard.ratingsDistribution.map(
              (rating: any) => (
                <div key={rating.stars}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      {rating.stars} Stars
                    </span>

                    <span className="font-semibold text-green-600">
                      {rating.count}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${
                          (rating.count /
                            Math.max(
                              ...dashboard.ratingsDistribution.map(
                                (
                                  r: any
                                ) =>
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

          {/* AVG */}

          <div className="mt-8 rounded-2xl border bg-gray-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Average Rating
                </p>

                <h3 className="mt-2 text-4xl font-bold text-gray-900">
                  {
                    dashboard.stats
                      .avgRating
                  }
                </h3>
              </div>

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <Star
                      key={star}
                      size={22}
                      className="fill-yellow-400 text-yellow-400"
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}