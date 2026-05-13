// ============================================================
// FILE: server/src/modules/ai/ai.controller.js
// ============================================================

import { runAgentLoop } from "./ai.service.js";

/**
 * POST /api/ai/query
 * Body: { query: string }
 */
export async function handleAdminQuery(req, res) {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required and must be a non-empty string." });
    }

    if (query.trim().length > 500) {
      return res.status(400).json({ error: "Query too long. Keep it under 500 characters." });
    }

    const result = await runAgentLoop(query.trim());
    return res.status(200).json(result);
  } catch (err) {
    console.error("[AI Controller] Unhandled error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
