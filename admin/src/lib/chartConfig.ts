// Shared chart configuration and styles

export const chartColors = {
  text: {
    primary: "#18181b", // zinc-950
    secondary: "#71717a", // zinc-500
    muted: "#a1a1aa", // zinc-400
  },
  border: "#e4e4e7", // zinc-200
  background: "#ffffff",
  pie: ["#18181b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7", "#f4f4f5"],
};

export const tooltipStyle = {
  borderRadius: 8,
  border: `1px solid ${chartColors.border}`,
  boxShadow: "0 12px 30px rgba(24,24,27,0.10)",
  backgroundColor: chartColors.background,
};

export const axisConfig = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12, fill: chartColors.text.secondary },
};

export const chartMargin = {
  top: 8,
  right: 8,
  bottom: 0,
  left: 0,
};
