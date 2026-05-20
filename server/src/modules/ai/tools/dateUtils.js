// ============================================================
// FILE: server/src/modules/ai/tools/dateUtils.js
// ============================================================
// Resolves date args from LLM into { startDate, endDate }
// Supports:
//   range: "7d" | "30d" | "90d"          → relative from now
//   from: "2025-01-01", to: "2025-01-07" → exact date range
// LLM resolves natural language ("yesterday", "last week",
// "first week of month") into from/to before calling tools.
// ============================================================

/**
 * @param {object} args - { range?, from?, to? }
 * @returns {{ startDate: Date, endDate: Date, label: string }}
 */
export function resolveDateRange(args = {}) {
  const { range = "30d", from, to } = args;

  // ── Exact date range from LLM ─────────────────────────
  if (from && to) {
    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const label = `${from} to ${to}`;
    return { startDate, endDate, label };
  }

  // ── Relative range ────────────────────────────────────
  const days = parseInt(range) || 30;
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return { startDate, endDate, label: range };
}