"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  axisConfig,
  chartMargin,
  tooltipStyle,
} from "../../lib/chartConfig";

export type RevenuePoint = {
  _id: string;
  total: number;
};

type RevenueChartProps = {
  data: RevenuePoint[];
};

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-72 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-900">Revenue</h3>
        <p className="text-sm text-zinc-500">Daily order value</p>
      </div>

      <ResponsiveContainer width="100%" height="78%">
        <LineChart data={data} margin={chartMargin}>
          {/* SUBTLE GRID */}
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

          <XAxis dataKey="_id" {...axisConfig} />
          <YAxis {...axisConfig} width={44} />

          {/* TOOLTIP */}
          <Tooltip
            formatter={(value) => [
              `₹${Number(value).toLocaleString("en-IN")}`,
              "Revenue",
            ]}
            labelClassName="text-zinc-500"
            contentStyle={{
              ...tooltipStyle,
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          {/* LINE */}
          <Line
            type="monotone"
            dataKey="total"
            stroke="#10b981" // emerald-500
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 6,
              fill: "#3b82f6", // blue accent
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}