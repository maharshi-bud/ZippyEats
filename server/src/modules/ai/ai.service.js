// ============================================================
// FILE: server/src/modules/ai/ai.service.js
// ============================================================

import { systemPrompt } from "./prompts/systemPrompt.js";
import { toolRegistry } from "./toolRegistry.js";
import "dotenv/config";

// 🔁 Provider auto-switch based on environment
// Development → Ollama (local, free)
// Production  → OpenRouter (hosted, paid)
const isDev = process.env.NODE_ENV === "development";

// const { chatCompletion } = isDev
//   ? await import("./providers/ollama.provider.js")
//   : await import("./providers/openrouter.provider.js");
// console.log("API KEY:", process.env.OPENROUTER_API_KEY?.slice(0, 10));
  const { chatCompletion } = isDev
  ? await import("./providers/ollama.provider.js")
  : await import("./providers/openrouter.provider.js");
const MAX_ITERATIONS = 5; // safety cap on agent loop

/**
 * Core agent loop.
 * 1. Sends user query to LLM
 * 2. LLM picks a tool
 * 3. We execute the tool
 * 4. Feed result back to LLM
 * 5. LLM gives final answer
 *
 * @param {string} userQuery
 * @returns {Promise<{ response: string }>}
 */
export async function runAgentLoop(userQuery) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userQuery },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let raw;

    try {
      raw = await chatCompletion(messages);
    } catch (err) {
      console.error("[AI Service] LLM call failed:", err.message);
      return { response: "AI service is currently unavailable. Please try again." };
    }

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // LLM didn't return JSON — return raw as fallback
      console.warn("[AI Service] Non-JSON response from LLM:", raw);
      return { response: raw };
    }

    // ✅ Final answer — return to user
    if (parsed.action === "final_answer") {
      return { response: parsed.response };
    }

    // ❓ Clarification needed
    if (parsed.action === "clarify") {
      return { response: parsed.message };
    }

    // 🔧 Tool call — execute it
    if (parsed.action === "tool_call") {
      const toolName = parsed.tool;
      const toolFn = toolRegistry[toolName];

      if (!toolFn) {
        console.warn(`[AI Service] Unknown tool requested: ${toolName}`);
        return { response: `I tried to use an unknown tool (${toolName}). Please rephrase your question.` };
      }

      let toolResult;
      try {
        toolResult = await toolFn(parsed.args || {});
      } catch (err) {
        console.error(`[AI Service] Tool "${toolName}" failed:`, err.message);
        return { response: `Failed to fetch data for your query. Please try again.` };
      }

      // Feed result back to conversation
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `Tool "${toolName}" returned this result:\n${JSON.stringify(toolResult, null, 2)}\n\nNow give your final_answer as JSON.`,
      });

      // Continue loop → LLM will now produce final_answer
      continue;
    }

    // Unknown action
    return { response: "Unexpected response format from AI. Please try again." };
  }

  return { response: "Analysis took too long. Please try a more specific question." };
}
