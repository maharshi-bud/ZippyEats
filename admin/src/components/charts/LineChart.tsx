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
    <div className="h-72 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height="78%">
        <LineChart data={data} margin={chartMargin}>
          <XAxis dataKey="_id" {...axisConfig} />
          <YAxis {...axisConfig} width={44} />
          <Tooltip
            formatter={(value) => [value, dataKey]}
            labelClassName="text-zinc-500"
            contentStyle={tooltipStyle}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
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
