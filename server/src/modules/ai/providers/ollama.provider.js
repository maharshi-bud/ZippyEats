// ============================================================
// FILE: server/src/modules/ai/providers/ollama.provider.js
// ============================================================
// Used in DEVELOPMENT (local machine with Ollama running)
// Requires: ollama running locally + model pulled
//   → ollama pull qwen2.5:14b
// ============================================================

import ollama from "ollama";

/**
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
export async function chatCompletion(messages) {
  const res = await ollama.chat({
    model: process.env.OLLAMA_MODEL || "qwen2.5:14b",
    messages,
  });

  return res.message.content;
}
