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
    signal: AbortSignal.timeout(15000),
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

export async function updateAgent(agentId, { voiceId, name, webhookUrl }) {
  const patch = {};
  if (voiceId) patch.voice_id = voiceId;
  if (name) patch.agent_name = name;
  // Setting webhook_url here is what makes call events reach us. Without it,
  // Retell has the calls but never delivers them to our webhook.
  if (webhookUrl) patch.webhook_url = webhookUrl;
  if (!Object.keys(patch).length) return null;
  return retellFetch("PATCH", `/update-agent/${agentId}`, patch);
}

/**
 * Buy a phone number and point inbound calls at the agent. Returns the created
 * number object (its `phone_number` is the E.164 the customer forwards to).
 */
export async function buyNumber({ areaCode, nickname, agentId }) {
  // NOTE: do NOT set inbound_webhook_url here. That is a call-START routing
  // webhook (Retell POSTs it expecting per-call agent overrides), NOT the
  // call-event sink. Call events (call_ended/call_analyzed) are delivered to
  // the AGENT's webhook_url, set in createAgent. Setting inbound_webhook_url
  // pointed at our event handler put inbound calls on the dynamic-routing path.
  return retellFetch("POST", "/create-phone-number", {
    area_code: areaCode,
    toll_free: false,
    nickname,
    inbound_agents: [{ agent_id: agentId, weight: 1 }],
  });
}

/** Read an agent's config (to confirm its webhook_url is actually set). */
export async function getAgent(agentId) {
  return retellFetch("GET", `/get-agent/${encodeURIComponent(agentId)}`);
}

/** List the most recent calls Retell has on record (diagnostics). */
export async function listCalls({ limit = 10 } = {}) {
  return retellFetch("POST", "/v2/list-calls", { limit, sort_order: "descending" });
}

/** Read a phone number's config (to confirm its agent binding). */
export async function getPhoneNumber(phoneNumber) {
  return retellFetch("GET", `/get-phone-number/${encodeURIComponent(phoneNumber)}`);
}

/**
 * Update a phone number's config. PATCH only touches the fields you pass, so
 * sending just { inbound_webhook_url: null } clears that field without
 * unbinding the agent. (Verified against Retell's SDK: update-phone-number.)
 */
export async function updatePhoneNumber(phoneNumber, patch) {
  return retellFetch("PATCH", `/update-phone-number/${encodeURIComponent(phoneNumber)}`, patch);
}

/**
 * PAUSE a number (over usage limit): detach its inbound agent so Retell stops
 * answering — no more billable minutes — while the customer keeps their number.
 * Reversible with rebindNumber. Tries both the current (inbound_agents) and
 * legacy (inbound_agent_id) field shapes so it works across API versions.
 */
export async function unbindNumber(phoneNumber) {
  try {
    return await updatePhoneNumber(phoneNumber, { inbound_agents: [] });
  } catch {
    return updatePhoneNumber(phoneNumber, { inbound_agent_id: null });
  }
}

/** RESUME a paused number: re-attach its inbound agent (month reset / upgrade). */
export async function rebindNumber(phoneNumber, agentId) {
  try {
    return await updatePhoneNumber(phoneNumber, {
      inbound_agents: [{ agent_id: agentId, weight: 1 }],
    });
  } catch {
    return updatePhoneNumber(phoneNumber, { inbound_agent_id: agentId });
  }
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
 * never hardcode a stale id. Ava and Grace are BOTH female but must map to
 * DISTINCT voices (else "choose your voice" is a lie). Falls back to a
 * known-good voice on any error.
 *   "Ava"  -> warm female (1st) · "Grace" -> calm female (2nd) · "Noah" -> male
 */
export async function pickVoice(voiceName) {
  const name = String(voiceName || "").toLowerCase();
  try {
    const voices = await retellFetch("GET", "/list-voices");
    if (Array.isArray(voices) && voices.length) {
      const byGender = (g) =>
        voices.filter((v) => (v.voice_id) && (v.gender || "").toLowerCase() === g);
      if (name === "noah") {
        const males = byGender("male");
        if (males[0]) return males[0].voice_id;
      } else {
        const females = byGender("female");
        // Grace = a different female than Ava, when the catalog has two.
        const idx = name === "grace" && females.length > 1 ? 1 : 0;
        if (females[idx]) return females[idx].voice_id;
        if (females[0]) return females[0].voice_id;
      }
      if (voices[0]?.voice_id) return voices[0].voice_id;
    }
  } catch {
    /* fall through to default */
  }
  return FALLBACK_VOICE;
}
