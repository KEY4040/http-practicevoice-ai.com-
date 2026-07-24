/**
 * Server-side script writer. Given a business name + industry, generates a
 * ready-to-use AI-receptionist script. Backed by an LLM over a simple HTTP API.
 *
 * The API key lives ONLY on the server (never shipped to the browser). No-ops
 * (returns { simulated: true }) until the key is set, so the rest of the app
 * works before it's connected — mirrors email.mjs / sms.mjs.
 *
 * Env:
 *   GEMINI_API_KEY   the generation API key (required to generate for real)
 *   GEMINI_MODEL     optional model override (default: gemini-2.0-flash)
 */

const DEFAULT_MODEL = "gemini-2.0-flash";

// The exact system instruction that shapes every generated script. Kept here
// (server-side) so it can never be seen or altered from the browser.
export const RECEPTIONIST_SYSTEM_INSTRUCTION = `You are an expert AI architect building instructions for an AI voice receptionist. The user will provide their 'Business Name' and 'Industry'. You must generate a highly professional, concise, 3-4 paragraph instruction script for the AI receptionist to follow.

Output Requirements:
- Write strictly in the third person as rules for the AI.
- Include a warm greeting protocol.
- Define the tone based on industry.
- Include a directive to capture the caller's name, phone number, and reason for calling.
- Include a directive on how to handle booking or taking a message based on the industry.
- Always confirm the caller's details back to them before ending the call.
- Include a polite closing that summarizes next steps.

Do not include any filler text, introductory remarks, or markdown outside of the script itself. Output ONLY the raw script.`;

export function hasGemini() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Build the (pure) request body for the generation API. Exported for testing. */
export function buildPayload({ businessName, industry }) {
  return {
    systemInstruction: { parts: [{ text: RECEPTIONIST_SYSTEM_INSTRUCTION }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `Business Name: ${businessName}\nIndustry: ${industry}` }],
      },
    ],
    generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 1200 },
  };
}

/** Strip any stray markdown code fences a model might wrap the output in. */
export function cleanScript(text) {
  let t = String(text || "").trim();
  // Remove a leading ```lang and trailing ``` fence if the whole thing is fenced.
  const fenced = t.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fenced) t = fenced[1].trim();
  return t;
}

/**
 * Generate a receptionist script from a business name + industry.
 * Returns { text } on success, { simulated:true } if unconfigured, or { error }.
 */
export async function generateReceptionistScript({ businessName, industry }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { simulated: true };

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Header auth keeps the key out of the URL/query string (and logs).
        "x-goog-api-key": key,
      },
      body: JSON.stringify(buildPayload({ businessName, industry })),
    });
  } catch (e) {
    return { error: `network: ${e.message}` };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { error: `status_${res.status}`, detail: detail.slice(0, 500) };
  }

  const data = await res.json().catch(() => null);
  const cand = data?.candidates?.[0];
  const text = cleanScript(
    (cand?.content?.parts || []).map((p) => p?.text || "").join("")
  );
  if (!text) {
    const reason =
      cand?.finishReason || data?.promptFeedback?.blockReason || "empty";
    return { error: `no_output_${reason}` };
  }
  return { text };
}
