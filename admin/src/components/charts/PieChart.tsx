"use client";

import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { tooltipStyle } from "../../lib/chartConfig";

type PieChartProps = {
  data: any[];
  title: string;
  subtitle: string;
};

// 🎯 Semantic + brand colors
const STATUS_COLORS: Record<string, string> = {
  delivered: "#10b981",          // emerald
  cancelled: "#ef4444",          // red
  out_for_delivery: "#3b82f6",   // blue
  preparing: "#f59e0b",          // amber
  accepted: "#6366f1",           // indigo
  placed: "#94a3b8",             // slate
};

export default function PieChartComp({
  data,
  title,
  subtitle,
}: PieChartProps) {
  return (
    <div className="h-72 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
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
            outerRadius={85}
            innerRadius={45} // 🔥 donut style (cleaner)
            paddingAngle={3} // spacing between slices
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  STATUS_COLORS[entry._id] ||
                  ["#10b981", "#3b82f6", "#6366f1"][index % 3]
                }
              />
            ))}
          </Pie>

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              ...tooltipStyle,
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          {/* LEGEND */}
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "#52525b",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}