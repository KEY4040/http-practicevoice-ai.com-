/**
 * Retell management API (server-only) — used to auto-provision a fresh AI
 * receptionist per customer: create the LLM (its brain/script), create the
 * agent (its voice), buy a phone number, and bind the number to the agent so
 * inbound calls reach it.
 *
 * Env:
 *   RETELL_API_KEY   (server-only secret; the "practicevoice-live" key)
 *
 * All calls hit https://api.retellai.com with `Authorization: Bearer <key>`.
 * Field shapes follow the current API (2026): create-retell-llm requires
 * `start_speaker`; numbers bind via `inbound_agents: [{agent_id, weight}]`
 * (the old `inbound_agent_id` was removed).
 */

const BASE = "https://api.retellai.com";
const DEFAULT_MODEL = "gpt-4.1";
const FALLBACK_VOICE = "retell-Cimo"; // known-good male voice; swapped by pickVoice

export function hasRetell() {
  return Boolean(process.env.RETELL_API_KEY);
}

async function retellFetch(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.error_message || data?.message || text || `HTTP ${res.status}`;
    const err = new Error(`Retell ${method} ${path} failed: ${res.status} ${msg}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Create the response engine (the prompt/brain). Returns { llm_id }. */
export async function createLlm({ prompt, beginMessage }) {
  return retellFetch("POST", "/create-retell-llm", {
    start_speaker: "agent",
    model: DEFAULT_MODEL,
    model_temperature: 0.2,
    general_prompt: prompt,
    begin_message: beginMessage,
  });
}

/** Create the agent (voice + which LLM it uses). Returns { agent_id }. */
export async function createAgent({ llmId, voiceId, name, webhookUrl }) {
  return retellFetch("POST", "/create-agent", {
    response_engine: { type: "retell-llm", llm_id: llmId },
    voice_id: voiceId || FALLBACK_VOICE,
    agent_name: name,
    language: "en-US",
    ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
  });
}

export async function updateLlm(llmId, { prompt, beginMessage }) {
  const patch = {};
  if (prompt != null) patch.general_prompt = prompt;
  if (beginMessage != null) patch.begin_message = beginMessage;
  if (!Object.keys(patch).length) return null;
  return retellFetch("PATCH", `/update-retell-llm/${llmId}`, patch);
}

export async function updateAgent(agentId, { voiceId, name }) {
  const patch = {};
  if (voiceId) patch.voice_id = voiceId;
  if (name) patch.agent_name = name;
  if (!Object.keys(patch).length) return null;
  return retellFetch("PATCH", `/update-agent/${agentId}`, patch);
}

/**
 * Buy a phone number and point inbound calls at the agent. Returns the created
 * number object (its `phone_number` is the E.164 the customer forwards to).
 */
export async function buyNumber({ areaCode, nickname, agentId, webhookUrl }) {
  return retellFetch("POST", "/create-phone-number", {
    area_code: areaCode,
    toll_free: false,
    nickname,
    inbound_agents: [{ agent_id: agentId, weight: 1 }],
    ...(webhookUrl ? { inbound_webhook_url: webhookUrl } : {}),
  });
}

/** Teardown (used to shut a trial off). Order: number → agent → llm. */
export async function deleteNumber(phoneNumber) {
  return retellFetch("DELETE", `/delete-phone-number/${encodeURIComponent(phoneNumber)}`);
}
export async function deleteAgent(agentId) {
  return retellFetch("DELETE", `/delete-agent/${agentId}`);
}
export async function deleteLlm(llmId) {
  return retellFetch("DELETE", `/delete-retell-llm/${llmId}`);
}

/**
 * Pick a voice_id matching the requested tone, from the live catalog so we
 * never hardcode a stale id. Falls back to a known-good voice on any error.
 *   "Ava"  -> warm female · "Grace" -> calm female · "Noah" -> confident male
 */
export async function pickVoice(voiceName) {
  const wantMale = String(voiceName).toLowerCase() === "noah";
  try {
    const voices = await retellFetch("GET", "/list-voices");
    if (Array.isArray(voices) && voices.length) {
      const gender = wantMale ? "male" : "female";
      const match =
        voices.find((v) => (v.gender || "").toLowerCase() === gender) || voices[0];
      if (match?.voice_id) return match.voice_id;
    }
  } catch {
    /* fall through to default */
  }
  return FALLBACK_VOICE;
}
