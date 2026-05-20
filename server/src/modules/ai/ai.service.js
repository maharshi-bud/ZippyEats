// ============================================================
// FILE: server/src/modules/ai/ai.service.js
// ============================================================
// CHANGES:
// 1. Multi-tool: LLM can now request multiple tools in one turn
//    via { "action": "tool_calls", "tools": [...] }
// 2. Custom dates: user query is enriched with today's date so
//    LLM can resolve "yesterday", "last week", etc. into
//    { from, to } args that tools now accept
// 3. MAX_ITERATIONS raised to 10 to allow multi-tool analysis
// ============================================================

import { systemPrompt } from "./prompts/systemPrompt.js";
import { toolRegistry } from "./toolRegistry.js";
import "dotenv/config";

const isDev = process.env.NODE_ENV === "development";
const { chatCompletion } = isDev
  ? await import("./providers/ollama.provider.js")
  : await import("./providers/openrouter.provider.js");

const MAX_ITERATIONS = 10;

// ── Inject today's date into every query ─────────────────
// This lets the LLM resolve "yesterday", "last week",
// "first week of the month" into actual { from, to } dates.
function buildUserMessage(userQuery) {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // "2025-01-15"
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" }); // "Wednesday"

  return `Today is ${dayName}, ${dateStr}.

User query: ${userQuery}`;
}

// ── Execute a single tool call ────────────────────────────
async function executeTool(toolName, args) {
  const toolFn = toolRegistry[toolName];
  if (!toolFn) {
    return { error: `Unknown tool: ${toolName}` };
  }
  try {
    return await toolFn(args || {});
  } catch (err) {
    console.error(`[AI Service] Tool "${toolName}" failed:`, err.message);
    return { error: err.message };
  }
}

/**
 * Core agent loop — supports:
 * - Single tool call:   { action: "tool_call", tool, args }
 * - Multi tool calls:   { action: "tool_calls", tools: [{ tool, args }, ...] }
 * - Final answer:       { action: "final_answer", response }
 * - Clarify:            { action: "clarify", message }
 */
export async function runAgentLoop(userQuery) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildUserMessage(userQuery) },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let raw;
    try {
      raw = await chatCompletion(messages);
    } catch (err) {
      console.error("[AI Service] LLM call failed:", err.message);
      return { response: "AI service is currently unavailable. Please try again." };
    }

    const clean = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.warn("[AI Service] Non-JSON response:", raw);
      return { response: raw };
    }

    // ── Final answer ────────────────────────────────────
    if (parsed.action === "final_answer") {
      return { response: parsed.response };
    }

    // ── Clarification needed ─────────────────────────────
    if (parsed.action === "clarify") {
      return { response: parsed.message };
    }

    // ── Single tool call ─────────────────────────────────
    if (parsed.action === "tool_call") {
      console.log(`[AI Service] Tool call: ${parsed.tool}`, parsed.args);
      const result = await executeTool(parsed.tool, parsed.args);

      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `Tool "${parsed.tool}" result:\n${JSON.stringify(result, null, 2)}\n\nContinue: call more tools if needed, or give final_answer.`,
      });
      continue;
    }

    // ── Multiple tool calls in parallel ──────────────────
    // LLM sends: { action: "tool_calls", tools: [{ tool, args }, ...] }
    if (parsed.action === "tool_calls" && Array.isArray(parsed.tools)) {
      console.log(`[AI Service] Parallel tool calls:`, parsed.tools.map(t => t.tool));

      const results = await Promise.all(
        parsed.tools.map(async ({ tool, args }) => {
          const result = await executeTool(tool, args);
          return { tool, args, result };
        })
      );

      const resultsText = results
        .map(({ tool, result }) => `Tool "${tool}" result:\n${JSON.stringify(result, null, 2)}`)
        .join("\n\n---\n\n");

      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `${resultsText}\n\nAll tools have returned results. Now give your final_answer as JSON with a comprehensive analysis combining all the data above.`,
      });
      continue;
    }

    return { response: "Unexpected response format from AI. Please try again." };
  }

  return { response: "Analysis took too long. Please try a more specific question." };
}