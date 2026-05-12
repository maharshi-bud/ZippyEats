"use client";

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  BarChart,
} from "recharts";

export default function RestaurantBarChart({
  data,
}: {
  data: any[];
}) {
  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#2a2f3d"
        />

        <XAxis
          dataKey="time"
          stroke="#9ca3af"
        />

        <YAxis stroke="#9ca3af" />

        <Tooltip />

        <Bar
          dataKey="orders"
          fill="#f97316"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}