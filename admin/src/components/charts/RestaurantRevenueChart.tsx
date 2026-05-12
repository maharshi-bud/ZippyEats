"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function RestaurantRevenueChart({
  data,
}: {
  data: any[];
}) {
  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#2a2f3d"
        />

        <XAxis
          dataKey="label"
          stroke="#9ca3af"
        />

        <YAxis stroke="#9ca3af" />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#f97316"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}