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

export async function chatCompletion(messages) {
  const res = await client.chat.completions.create({
    model: 
    // "qwen/qwen-2.5-7b-instruct:free",
  //  "inclusionai/ring-2.6-1t:free"
   "arcee-ai/trinity-large-thinking:free"
  // "openrouter/owl-alpha"
  // "nvidia/nemotron-3-nano-30b-a3b:free"
  // "poolside/laguna-xs.2:free"
   ,
    messages,
    temperature: 0.2,
    max_tokens: 1000,
  });
  return res.choices[0].message.content;
}
