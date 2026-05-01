"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts";
import { tooltipStyle, chartColors } from "../../lib/chartConfig";

type PieChartProps = {
  data: any[];
  title: string;
  subtitle: string;
};

const COLORS = chartColors?.pie || [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6"
];

export default function PieChartComp({
  data,
  title,
  subtitle,
}: PieChartProps) {
  return (
    <div className="h-72 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height="78%">
        <PieChart>
          <Pie
  data={data}
  dataKey="value"
  nameKey="_id"
  cx="50%"
  cy="50%"
  outerRadius={80}
>
  {data.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={COLORS[index % COLORS.length]}
    />
  ))}
</Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
