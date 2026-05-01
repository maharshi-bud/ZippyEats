"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisConfig, chartMargin, tooltipStyle, chartColors } from "../../lib/chartConfig";

export type RevenuePoint = {
  _id: string;
  total: number;
};

type RevenueChartProps = {
  data: RevenuePoint[];
};

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-72 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-950">Revenue</h3>
        <p className="text-sm text-zinc-500">Daily order value</p>
      </div>

      <ResponsiveContainer width="100%" height="78%">
        <LineChart data={data} margin={chartMargin}>
          <XAxis dataKey="_id" {...axisConfig} />
          <YAxis {...axisConfig} width={44} />
          <Tooltip
            formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
            labelClassName="text-zinc-500"
            contentStyle={tooltipStyle}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke={chartColors.text.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
