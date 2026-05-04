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

type LineChartProps = {
  data: any[];
  dataKey: string;
  title: string;
  subtitle: string;
};

export default function LineChartComp({
  data,
  dataKey,
  title,
  subtitle,
}: LineChartProps) {
  return (
    <div className="h-72 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height="78%">
        <LineChart data={data} margin={chartMargin}>
          {/* GRID (subtle) */}
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

          <XAxis dataKey="_id" {...axisConfig} />
          <YAxis {...axisConfig} width={44} />

          {/* TOOLTIP */}
          <Tooltip
            formatter={(value) => [value, dataKey]}
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
            dataKey={dataKey}
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