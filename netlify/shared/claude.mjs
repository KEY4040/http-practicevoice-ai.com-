/**
 * Claude (Anthropic) engine for the AI-receptionist script writer.
 * Uses the Messages API over plain HTTP (matches the codebase's provider
 * pattern — no SDK dependency, like email.mjs / sms.mjs / gemini.mjs). The API
 * key lives ONLY on the server (ANTHROPIC_API_KEY) and is never shipped to the
 * browser. No-ops to { simulated:true } until the key is set.
 *
 * Env:
 *   ANTHROPIC_API_KEY   the Claude API key (required to generate for real)
 *   GENERATOR_MODEL     optional model override (default: claude-opus-5).
 *                       Set to claude-haiku-4-5 for a cheaper/faster writer.
 */
import {
  RECEPTIONIST_SYSTEM_INSTRUCTION,
  buildUserContent,
  cleanScript,
} from "./scriptwriter-core.mjs";

const DEFAULT_MODEL = "claude-opus-5";

export function hasClaude() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Generate a receptionist script with Claude.
 * Returns { text } on success, { simulated:true } if unconfigured, or { error }.
 */
export async function generateWithClaude({ businessName, industry, services, hours }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { simulated: true };

  const model = process.env.GENERATOR_MODEL || DEFAULT_MODEL;
  const body = {
    model,
    max_tokens: 2048,
    system: RECEPTIONIST_SYSTEM_INSTRUCTION,
    messages: [
      { role: "user", content: buildUserContent({ businessName, industry, services, hours }) },
    ],
    // Low effort keeps this cheap and fast for a short, well-scoped generation.
    output_config: { effort: "low" },
  };

  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { error: `network: ${e.message}` };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { error: `status_${res.status}`, status: res.status, detail: detail.slice(0, 300) };
  }

  const data = await res.json().catch(() => null);
  // Safety classifiers can decline (HTTP 200 + stop_reason "refusal") — check
  // before reading content.
  if (data?.stop_reason === "refusal") return { error: "refusal" };
  const text = cleanScript(
    (data?.content || []).filter((b) => b?.type === "text").map((b) => b.text || "").join("")
  );
  if (!text) return { error: `no_output_${data?.stop_reason || "empty"}` };
  return { text, engine: "claude" };
}
