"use client";

import { useEffect, useState } from "react";
import RevenueChart, {
  type RevenuePoint,
} from "../../components/charts/RevenueChart";
import LineChartComp from "../../components/charts/LineChart";
import PieChartComp from "../../components/charts/PieChart";
import BarChartComp from "../../components/charts/BarChart";
import Card from "../../components/ui/Card";
import api from "../../lib/api";

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

const formatCurrency = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (loading || !stats) {
    return <p className="text-sm text-zinc-500">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Revenue" value={formatCurrency(stats.revenue)} />
        <Card title="Orders" value={stats.orders} />
        <Card title="New Users" value={stats.newUsers} />
        <Card title="Avg Order" value={formatCurrency(stats.avgOrder)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RevenueChart data={revenue} />
        <LineChartComp
          data={orders}
          dataKey="count"
          title="Orders Over Time"
          subtitle="Daily order count"
        />
        <PieChartComp
          data={orderStatus}
          title="Order Status Distribution"
          subtitle="Orders by status"
        />
        <BarChartComp
          data={topRestaurants}
          title="Top Restaurants"
          subtitle="By total revenue"
        />
        <BarChartComp
          data={topItems}
          title="Top Items"
          subtitle="By quantity ordered"
        />
        <LineChartComp
          data={usersGrowth}
          dataKey="count"
          title="User Growth"
          subtitle="Daily new users"
        />
      </div>
    </div>
  );
}
