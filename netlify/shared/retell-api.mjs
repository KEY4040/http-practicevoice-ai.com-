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

/**
 * Retell `general_tools` for Cal.com booking, built from a clinic's saved
 * calendar connection. Returns [] when no calendar is connected (agent simply
 * has no booking tools). Schema verified against Retell's TypeScript SDK: both
 * tools require type/name/cal_api_key/event_type_id; timezone + description are
 * optional. This is what makes each customer's AI book into THEIR own calendar.
 */
export function calTools(clinic) {
  const apiKey = clinic?.cal_api_key;
  const eventTypeId = clinic?.cal_event_type_id;
  if (!apiKey || !eventTypeId) return [];
  const tz = clinic?.cal_timezone || null;
  const base = {
    cal_api_key: apiKey,
    event_type_id: Number(eventTypeId),
    ...(tz ? { timezone: tz } : {}),
  };
  return [
    {
      type: "check_availability_cal",
      name: "check_availability_cal",
      description: "When the caller asks about times, check the calendar and offer open slots.",
      ...base,
    },
    {
      type: "book_appointment_cal",
      name: "book_appointment_cal",
      description: "When the caller picks a time, book it on the calendar.",
      ...base,
    },
  ];
}

/** Normalize a loosely-typed US number to +1 E.164, or "" if not 10 digits. */
export function toE164(s) {
  const ten = String(s || "").replace(/\D/g, "").slice(-10);
  return ten.length === 10 ? `+1${ten}` : "";
}

/**
 * The SINGLE source of truth for "is the VIP code-word transfer active?" — the
 * transfer tool (below) and the buildPrompt directive MUST both gate on this so
 * they can never diverge (a prompt that names a tool the agent doesn't have, or
 * vice-versa). Returns the ready-to-dial +1 E.164 owner cell when VIP is on AND
 * the cell normalizes to a valid US number AND a non-blank passphrase is set;
 * otherwise "". The trimmed passphrase, when active, is returned alongside.
 */
export function vipTransfer(clinic) {
  if (!clinic?.vip_enabled) return { cell: "", passphrase: "" };
  const cell = toE164(clinic?.vip_transfer_to);
  const passphrase = String(clinic?.vip_passphrase || "").trim();
  if (!cell || !passphrase) return { cell: "", passphrase: "" };
  return { cell, passphrase };
}

/**
 * Retell `transfer_call` tool for the VIP CODE WORD — a caller-ID-INDEPENDENT
 * backup to VIP Passthrough. Passthrough routes by caller ID at call start, but
 * a rare carrier can hide the number on a forwarded call. With a code word, any
 * caller who says the owner's private phrase is transferred to the owner's cell
 * mid-call, no matter what number they're on.
 *
 * Returns [] unless VIP is on AND a transfer cell AND a passphrase are all set.
 * The destination is a fixed literal (known at provision time) — NOT a dynamic
 * variable — precisely because the code-word path must work when caller ID (and
 * thus {{vip_cell}}) is missing. Schema verified against Retell's TS SDK
 * (LlmCreateParams.TransferCallTool): required {type,name,transfer_destination,
 * transfer_option}; cold (blind) transfer via transfer_option.type.
 */
export function vipTransferTool(clinic) {
  const { cell } = vipTransfer(clinic);
  if (!cell) return [];
  return [
    {
      type: "transfer_call",
      name: "transfer_to_owner",
      description:
        "Transfer the call to the business owner immediately. Call this the moment the caller says the private VIP code word.",
      transfer_destination: { type: "predefined", number: cell },
      transfer_option: { type: "cold_transfer" },
    },
  ];
}

/**
 * Post-call extraction schema attached to EVERY provisioned agent. Retell's LLM
 * fills these after each call; the webhook's parseCall reads them from
 * call_analysis.custom_analysis_data to decide whether an appointment was booked
 * (and to capture its details, escalation, and lead info). Without this, a
 * freshly provisioned agent returns an empty custom_analysis_data, so NO
 * appointment row / confirmation / owner alert / reminder ever fires — the whole
 * booking pipeline goes dark. Field names MUST match what parseCall reads.
 * (Schema verified against Retell's create-agent API: {type,name,description}.)
 */
export const POST_CALL_ANALYSIS = [
  {
    type: "boolean",
    name: "appointment_booked",
    description:
      "True ONLY if an appointment was actually scheduled during this call — the caller agreed to a specific date/time. False if no appointment was made, or it was cancelled/rescheduled-away.",
  },
  {
    type: "string",
    name: "appointment_type",
    description:
      "The type of appointment or service booked, e.g. 'cleaning', 'consultation', 'AC repair'. Empty if none.",
  },
  {
    type: "string",
    name: "appointment_time",
    description:
      "The appointment time in plain spoken words, e.g. 'Friday at 9:00 AM'. Empty if none.",
  },
  {
    type: "string",
    name: "appointment_datetime",
    description:
      "The booked appointment date and time in ISO 8601 format, e.g. 2026-07-25T09:00:00. Empty if none.",
  },
  {
    type: "string",
    name: "provider",
    description:
      "The staff member / provider the appointment is with, if mentioned, e.g. 'Dr. Patel'. Empty if none.",
  },
  {
    type: "string",
    name: "patient_name",
    description: "The caller's full name if given. Empty if not provided.",
  },
  {
    type: "boolean",
    name: "escalated",
    description:
      "True if the caller had an urgent issue or emergency that should be escalated to a human right away.",
  },
  {
    type: "string",
    name: "reason",
    description:
      "A short phrase describing why the caller called, e.g. 'toothache', 'book cleaning', 'billing question'.",
  },
  {
    type: "number",
    name: "revenue",
    description:
      "Estimated dollar value of the booked appointment/job if it can be reasonably inferred, otherwise 0.",
  },
];

/**
 * Clone a voice from audio samples (Retell POST /clone-voice, multipart). Used by
 * the one-time voice-cloning purchase: the owner's samples are forwarded here and
 * the returned voice_id becomes their agent's voice.
 *
 * `files` is an array of { data: Buffer|Blob, name, type } audio samples. We use
 * ElevenLabs as the provider (its voices speak multilingually, matching our
 * "multi" language agents). Schema verified against the Retell Clone Voice API:
 * multipart fields files[], voice_name, voice_provider; returns { voice_id, ... }.
 */
export async function cloneVoice({ files, voiceName }) {
  if (!Array.isArray(files) || files.length === 0) {
    const err = new Error("No audio files provided for voice cloning.");
    err.status = 400;
    throw err;
  }
  const form = new FormData();
  for (const f of files) {
    const blob = f.data instanceof Blob ? f.data : new Blob([f.data], { type: f.type || "audio/mpeg" });
    form.append("files", blob, f.name || "sample.mp3");
  }
  form.append("voice_name", String(voiceName || "My Voice").slice(0, 200));
  form.append("voice_provider", "elevenlabs");

  const res = await fetch(`${BASE}/clone-voice`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RETELL_API_KEY}` }, // no Content-Type: FormData sets the multipart boundary
    body: form,
    signal: AbortSignal.timeout(60000), // cloning is slower than a JSON call
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.message || data?.error_message || text || `HTTP ${res.status}`;
    const err = new Error(`Retell POST /clone-voice failed: ${res.status} ${msg}`);
    err.status = res.status;
    throw err;
  }
  return data; // { voice_id, voice_name, provider, gender, preview_audio_url, ... }
}

/** Create the response engine (the prompt/brain). Returns { llm_id }. */
export async function createLlm({ prompt, beginMessage, generalTools }) {
  return retellFetch("POST", "/create-retell-llm", {
    start_speaker: "agent",
    model: DEFAULT_MODEL,
    model_temperature: 0.2,
    general_prompt: prompt,
    begin_message: beginMessage,
    ...(generalTools && generalTools.length ? { general_tools: generalTools } : {}),
  });
}

/** Create the agent (voice + which LLM it uses). Returns { agent_id }. */
export async function createAgent({ llmId, voiceId, name, webhookUrl }) {
  return retellFetch("POST", "/create-agent", {
    response_engine: { type: "retell-llm", llm_id: llmId },
    voice_id: voiceId || FALLBACK_VOICE,
    agent_name: name,
    // "multi" = multilingual: the agent recognizes and answers in the caller's
    // own language (English, Spanish, and more) automatically — no per-customer
    // setup. (Verified against Retell SDK: the exact literal is "multi".)
    language: "multi",
    // Extraction schema so the webhook can detect bookings on THIS agent (see
    // POST_CALL_ANALYSIS). Without it the booking pipeline is dark.
    post_call_analysis_data: POST_CALL_ANALYSIS,
    ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
  });
}

export async function updateLlm(llmId, { prompt, beginMessage, generalTools }) {
  const patch = {};
  if (prompt != null) patch.general_prompt = prompt;
  if (beginMessage != null) patch.begin_message = beginMessage;
  // Passing general_tools REPLACES the tool set — so a re-sync attaches the
  // booking tools when a calendar is connected, and removes them when it's
  // disconnected (empty array). Only pass it when explicitly provided.
  if (generalTools != null) patch.general_tools = generalTools;
  if (!Object.keys(patch).length) return null;
  return retellFetch("PATCH", `/update-retell-llm/${llmId}`, patch);
}

export async function updateAgent(agentId, { voiceId, name, webhookUrl, language }) {
  const patch = {};
  if (voiceId) patch.voice_id = voiceId;
  if (name) patch.agent_name = name;
  // Setting webhook_url here is what makes call events reach us. Without it,
  // Retell has the calls but never delivers them to our webhook.
  if (webhookUrl) patch.webhook_url = webhookUrl;
  // Upgrade older agents to multilingual on re-activation.
  if (language) patch.language = language;
  // Self-heal: ensure the post-call extraction schema is present so booking
  // detection works on agents provisioned before it existed. Idempotent.
  patch.post_call_analysis_data = POST_CALL_ANALYSIS;
  return retellFetch("PATCH", `/update-agent/${agentId}`, patch);
}

/**
 * Buy a phone number and point inbound calls at the agent. Returns the created
 * number object (its `phone_number` is the E.164 the customer forwards to).
 */
export async function buyNumber({ areaCode, nickname, agentId, inboundWebhookUrl }) {
  // TWO different webhooks, two different jobs:
  //  - inbound_webhook_url  = call-START routing. Point it at our retell-inbound
  //    handler so VIP callers get routed straight through the instant they dial,
  //    before any greeting. (Earlier this was wrongly pointed at the EVENT sink,
  //    which broke routing — hence it was removed. retell-inbound is the correct
  //    handler and returns the right { call_inbound: {...} } shape.)
  //  - the AGENT's webhook_url (set in createAgent) still receives call EVENTS
  //    (call_ended/call_analyzed) for logging. Leave that untouched.
  return retellFetch("POST", "/create-phone-number", {
    area_code: areaCode,
    toll_free: false,
    nickname,
    inbound_agents: [{ agent_id: agentId, weight: 1 }],
    ...(inboundWebhookUrl ? { inbound_webhook_url: inboundWebhookUrl } : {}),
  });
}

/** Read an agent's config (to confirm its webhook_url is actually set). */
export async function getAgent(agentId) {
  return retellFetch("GET", `/get-agent/${encodeURIComponent(agentId)}`);
}

/** List the most recent calls Retell has on record (diagnostics). */
export async function listCalls({ limit = 10 } = {}) {
  // v3 replaced the deprecated POST /v2/list-calls (removed 06/15/2026). v3
  // returns unified pagination: { items, pagination_key, has_more } instead of
  // a top-level array — callers read `items`.
  return retellFetch("POST", "/v3/list-calls", { limit, sort_order: "descending" });
}

/** Read a phone number's config (to confirm its agent binding). */
export async function getPhoneNumber(phoneNumber) {
  return retellFetch("GET", `/get-phone-number/${encodeURIComponent(phoneNumber)}`);
}

/**
 * Find a phone number already bound (inbound) to this agent, if any. Makes
 * provisioning idempotent: if a prior buy succeeded at Retell but its DB write
 * failed, we REUSE that number instead of buying — and billing for — a second
 * one.
 *
 * Returns the E.164 string, or null when the agent genuinely has no number.
 * FAILS CLOSED: it lets a list/API error PROPAGATE rather than returning null,
 * so the caller aborts the purchase instead of buying a duplicate number when it
 * couldn't confirm none exists. Callers wrap the buy in try/catch and surface the
 * error, so the owner simply retries — no second billable number.
 */
export async function findAgentNumber(agentId) {
  if (!agentId) return null;
  const matches = (n) => {
    const inbound =
      n.inbound_agent_id ||
      (Array.isArray(n.inbound_agents) && n.inbound_agents[0]?.agent_id);
    return inbound && inbound === agentId;
  };
  // Page through the full list — this is the guard against DUPLICATE PURCHASES,
  // so it must see every number, not just the first page. Once the account holds
  // more numbers than one page returns, a single-page scan could miss this
  // agent's already-bound number and let the caller buy (and bill) a second one.
  let paginationKey;
  for (let page = 0; page < 50; page++) {
    const qs = paginationKey ? `?pagination_key=${encodeURIComponent(paginationKey)}` : "";
    const list = await retellFetch("GET", `/list-phone-numbers${qs}`);
    const arr = Array.isArray(list) ? list : list?.items || [];
    const match = arr.find(matches);
    if (match?.phone_number) return match.phone_number;
    // Stop when the API signals no more pages (or gives us nothing to page on).
    const more = !Array.isArray(list) && list?.has_more && list?.pagination_key;
    if (!more) break;
    paginationKey = list.pagination_key;
  }
  return null;
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
 * Tear down a clinic's Retell resources (number → agent → llm) and return ONLY
 * the DB columns whose delete actually SUCCEEDED (as {col: null}). A transiently
 * failed delete is left in the DB so the next hourly sweep retries it — so a
 * still-billing number is never orphaned by nulling its reference too early.
 */
export async function teardownRetell(clinic) {
  const cleared = {};
  const step = async (id, fn, col) => {
    if (!id) return;
    try {
      await fn(id);
      cleared[col] = null;
    } catch (e) {
      console.error(`[retell] ${col} teardown failed (retry next sweep): ${((e && e.message) || e).toString().slice(0, 80)}`);
    }
  };
  await step(clinic?.retell_number, deleteNumber, "retell_number");
  await step(clinic?.retell_agent_id, deleteAgent, "retell_agent_id");
  await step(clinic?.retell_llm_id, deleteLlm, "retell_llm_id");
  return cleared;
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
      // Prefer ElevenLabs voices — their models speak other languages (Spanish,
      // etc.) natively, so the "multi" language setting actually sounds good.
      const byGender = (g) =>
        voices
          .filter((v) => v.voice_id && (v.gender || "").toLowerCase() === g)
          .sort((a, b) => (b.provider === "elevenlabs") - (a.provider === "elevenlabs"));
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
