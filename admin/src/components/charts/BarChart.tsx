"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  axisConfig,
  chartMargin,
  tooltipStyle,
} from "../../lib/chartConfig";

type BarChartProps = {
  data: any[];
  title: string;
  subtitle: string;
};

export default function BarChartComp({
  data,
  title,
  subtitle,
}: BarChartProps) {
  return (
    <div className="h-72 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>

      {/* CHART */}
      <ResponsiveContainer width="100%" height="78%">
        <BarChart data={data} margin={chartMargin}>
          <XAxis dataKey="_id" {...axisConfig} />
          <YAxis {...axisConfig} width={44} />

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              ...tooltipStyle,
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          {/* BARS */}
          <Bar dataKey="total" radius={[8, 8, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={index % 2 === 0 ? "#10b981" : "rgb(15, 23, 50)"} // emerald / blue
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}