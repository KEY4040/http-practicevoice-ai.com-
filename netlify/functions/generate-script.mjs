/**
 * Netlify Function: generate-script
 * ---------------------------------------------------------------------------
 * Writes a first-draft AI-receptionist script from the owner's Business Name +
 * Industry, so a new customer never faces an empty box. Sign-in gated; the
 * generation API key stays server-side (see shared/gemini.mjs).
 *
 * Request:  { businessName, industry }
 * Response: { ok, script? , simulated?, error?, message? }
 */
import { getUserId, bearer } from "../shared/auth.mjs";
import { generateReceptionistScript } from "../shared/gemini.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  // Signed-in accounts only (the dashboard is behind auth) — keeps the generator
  // from being called anonymously.
  const uid = await getUserId(bearer(req));
  if (!uid) return json({ ok: false, error: "not_signed_in" }, 401);

  let body = {};
  try {
    body = await req.json();
  } catch {
    /* treat as empty */
  }
  // Cap length defensively — this is a short name + industry, not a document.
  const businessName = String(body.businessName || "").trim().slice(0, 120);
  const industry = String(body.industry || "").trim().slice(0, 120);
  if (!businessName || !industry) {
    return json(
      { ok: false, error: "missing_fields", message: "Enter your business name and industry first." },
      400
    );
  }

  const r = await generateReceptionistScript({ businessName, industry });
  if (r.simulated) return json({ ok: true, simulated: true });
  if (r.error) {
    console.error("[generate-script]", r.error, r.detail || "");
    return json(
      { ok: false, error: "generation_failed", message: "Couldn't write your script just now — please try again." },
      502
    );
  }
  return json({ ok: true, script: r.text });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
