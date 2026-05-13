// ============================================================
// FILE: server/src/modules/ai/providers/openrouter.provider.js
// ============================================================
// Used in PRODUCTION (hosted on Railway/Render)
// Requires: OPENROUTER_API_KEY in your .env
// ============================================================

import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
export async function chatCompletion(messages) {
  const res = await client.chat.completions.create({
    model: "qwen/qwen-2.5-72b-instruct",   // swap to deepseek/deepseek-chat if needed
    messages,
    temperature: 0.2,
    max_tokens: 1000,
  });

  return res.choices[0].message.content;
}
