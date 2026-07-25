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
 *   GEMINIAPIKEY     accepted as an alias (some hosts/keyboards make the
 *                    underscore form hard to enter) — either name works
 *   GEMINI_MODEL     optional model override; when unset, a usable model is
 *                    discovered from the API and cached (see discoverModel)
 */

/**
 * The generation key, under either accepted env name. Strips ALL whitespace —
 * these keys never contain spaces/tabs/newlines, so removing them defends
 * against stray characters a copy-paste (especially on mobile) can smuggle in,
 * which otherwise make the key look "malformed" (HTTP 400) to the API.
 */
function apiKey() {
  const raw = process.env.GEMINI_API_KEY || process.env.GEMINIAPIKEY || "";
  return raw.replace(/\s+/g, "");
}

// The system instruction + user-content builder + fence cleaner are shared with
// the Claude engine so both produce identical scripts. Imported for local use
// and re-exported so existing importers/tests keep resolving them from here.
import {
  RECEPTIONIST_SYSTEM_INSTRUCTION,
  buildUserContent,
  cleanScript,
} from "./scriptwriter-core.mjs";
export { RECEPTIONIST_SYSTEM_INSTRUCTION, buildUserContent, cleanScript };

export function hasGemini() {
  return Boolean(apiKey());
}

/** Build the (pure) request body for the generation API. Exported for testing. */
export function buildPayload({ businessName, industry, services, hours, model }) {
  const generationConfig = { temperature: 0.7, topP: 0.95, maxOutputTokens: 2048 };
  // 2.5-family models spend "thinking" tokens before writing; with a small
  // output budget they can return an EMPTY answer (finishReason MAX_TOKENS).
  // Turn thinking off for them so the whole budget goes to the script. The field
  // is only valid on 2.5 models, so we add it only there.
  if (String(model || "").includes("2.5")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  return {
    systemInstruction: { parts: [{ text: RECEPTIONIST_SYSTEM_INSTRUCTION }] },
    contents: [
      { role: "user", parts: [{ text: buildUserContent({ businessName, industry, services, hours }) }] },
    ],
    generationConfig,
  };
}

// Models to try, in order, when no explicit GEMINI_MODEL is set and discovery
// is unavailable. Different keys have access to different models, so we fall
// through to the next only when a model is missing/unsupported (a 404) — never
// on an auth/quota error, where trying another model wouldn't help.
const CANDIDATE_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

/**
 * Pick the best usable model name from a ListModels response. Prefers a fast
 * "flash" model (2.0, then 2.5, then any flash), else any model that supports
 * generateContent. Returns a bare id ("gemini-2.0-flash") or null. Pure/tested.
 */
export function pickModelName(models) {
  return pickModels(models)[0] || null;
}

/**
 * Return a PRIORITIZED list of usable model ids (bare, "models/" stripped) from a
 * ListModels response — generateContent-capable only, flash/cheap first. We try
 * several because an alias like "gemini-2.0-flash" can 404 for a key while its
 * pinned sibling "gemini-2.0-flash-001" works; trying the account's real names
 * (both aliases and versioned) is what makes generation actually go through.
 * Bounded to a handful so we never fan out over dozens of models. Pure/tested.
 */
export function pickModels(models, limit = 6) {
  const usable = (models || []).filter((m) =>
    (m?.supportedGenerationMethods || []).includes("generateContent")
  );
  const rank = (name) => {
    const n = String(name);
    if (/gemini-2\.0-flash/.test(n) && !/lite/.test(n)) return 0;
    if (/gemini-2\.5-flash/.test(n) && !/lite/.test(n)) return 1;
    if (/flash/.test(n) && /lite/.test(n)) return 2;
    if (/flash/.test(n)) return 3;
    if (/pro/.test(n)) return 5;
    return 4;
  };
  return usable
    .map((m) => String(m.name).replace(/^models\//, ""))
    .filter((n) => !/embedding|aqa|imagen|veo|lyria|tts|audio|image|vision/i.test(n))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit);
}

// Cache the discovered models across warm invocations (stable per key), with a
// short TTL, so we don't pay the ListModels round-trip on every generation.
let _modelCache = { key: null, models: null, at: 0 };
const MODEL_TTL_MS = 30 * 60 * 1000; // 30 min

/**
 * Ask the API which models THIS key can actually call, so we never 404 on a
 * hardcoded name. Returns a prioritized list of usable model ids (see
 * pickModels), or [] on any error. Cached per key for MODEL_TTL_MS.
 */
async function discoverModel(key, now = Date.now()) {
  if (_modelCache.models && _modelCache.key === key && now - _modelCache.at < MODEL_TTL_MS) {
    return _modelCache.models;
  }
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
      { headers: { "x-goog-api-key": key } }
    );
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    const list = Array.isArray(data?.models) ? data.models : [];
    const models = pickModels(list);
    if (models.length) _modelCache = { key, models, at: now };
    return models;
  } catch {
    return [];
  }
}

/** Clear the cached models — used if the discovered set later 404s. */
function invalidateModelCache() {
  _modelCache = { key: null, models: null, at: 0 };
}

// Some keys/projects serve a model on only ONE API version. Try v1beta first,
// then v1, so a version-specific availability quirk can't wrongly read as 404.
const API_VERSIONS = ["v1beta", "v1"];

/** One generateContent call against a specific model + API version. */
async function callOnce({ key, model, apiVersion, businessName, industry, services, hours }) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(
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
      body: JSON.stringify(buildPayload({ businessName, industry, services, hours, model })),
    });
  } catch (e) {
    return { error: `network: ${e.message}` };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let msg = "";
    try {
      msg = JSON.parse(detail)?.error?.message || "";
    } catch {
      /* leave msg empty */
    }
    return { error: `status_${res.status}`, status: res.status, detail: detail.slice(0, 500), msg };
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

/** Try a model across API versions; only a 404 is worth trying the next version. */
async function callModel(args) {
  let last = { error: "no_versions" };
  for (const apiVersion of API_VERSIONS) {
    const r = await callOnce({ ...args, apiVersion });
    if (r.text) return { ...r, apiVersion };
    last = { ...r, apiVersion };
    if (r.status !== 404) break;
  }
  return last;
}

/**
 * Generate a receptionist script from a business name + industry.
 * Returns { text } on success, { simulated:true } if unconfigured, or { error }.
 * Tries the models this key can actually use in priority order, falling through
 * only on a 404 (model not found for this key).
 */
export async function generateReceptionistScript({ businessName, industry, services, hours }) {
  const key = apiKey();
  if (!key) return { simulated: true };

  let models;
  if (process.env.GEMINI_MODEL) {
    models = [process.env.GEMINI_MODEL];
  } else {
    // Discover the models this key can actually use (fixes hardcoded-name 404s);
    // try the account's own names first (aliases + versioned), then the known
    // candidates as a last resort.
    const discovered = await discoverModel(key);
    models = discovered.length
      ? [...discovered, ...CANDIDATE_MODELS.filter((m) => !discovered.includes(m))]
      : CANDIDATE_MODELS;
  }

  let last = { error: "no_models", engine: "gemini" };
  for (const model of models) {
    const r = await callModel({ key, model, businessName, industry, services, hours });
    if (r.text) return { ...r, engine: "gemini" };
    last = { ...r, model, engine: "gemini" };
    // Only a missing model is worth retrying on a different model.
    if (r.status !== 404) break;
    // A cached model that now 404s is stale — drop it so the next call re-discovers.
    invalidateModelCache();
  }
  return last;
}
