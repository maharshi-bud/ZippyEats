"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisConfig, chartMargin, tooltipStyle, chartColors } from "../../lib/chartConfig";

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
    <div className="h-72 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height="78%">
        <BarChart data={data} margin={chartMargin}>
          <XAxis dataKey="_id" {...axisConfig} />
          <YAxis {...axisConfig} width={44} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="total" fill={chartColors.text.primary} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
