/**
 * Netlify Function: generate-script
 * ---------------------------------------------------------------------------
 * Writes a first-draft AI-receptionist script from the owner's Business Name +
 * Industry (enriched with their saved services + hours), so a new customer never
 * faces an empty box. Sign-in + entitlement gated; the generation API key stays
 * server-side.
 *
 * Engine: uses Claude (ANTHROPIC_API_KEY) when configured — the reliable path —
 * and falls back to Gemini (GEMINI_API_KEY) otherwise. Both share the same
 * instructions, so the output is identical regardless of engine.
 *
 * Request:  { businessName, industry }
 * Response: { ok, script?, engine?, simulated?, error?, reason?, diag?, message? }
 */
import { getUserId, bearer, isEntitled } from "../shared/auth.mjs";
import { hasSupabase, sbSelect } from "../shared/supabase.mjs";
import { hasClaude, generateWithClaude } from "../shared/claude.mjs";
import { hasGemini, generateReceptionistScript } from "../shared/gemini.mjs";

const DAY_LABELS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

/** Look up the owner's saved services + hours to make the script specific. */
async function clinicDetails(uid) {
  if (!hasSupabase()) return { services: [], hours: "" };
  try {
    const rows = await sbSelect(
      "clinics",
      `select=services,open_days,open_time,close_time&owner_id=eq.${uid}&limit=1`
    );
    const c = rows[0] || {};
    const services = Array.isArray(c.services) ? c.services.filter(Boolean).slice(0, 20) : [];
    const days = (c.open_days || []).map((d) => DAY_LABELS[d] || d);
    const hours =
      days.length && c.open_time && c.close_time
        ? `${days.join(", ")}, ${String(c.open_time).slice(0, 5)}–${String(c.close_time).slice(0, 5)}`
        : "";
    return { services, hours };
  } catch {
    return { services: [], hours: "" };
  }
}

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  // Signed-in accounts only (the dashboard is behind auth).
  const uid = await getUserId(bearer(req));
  if (!uid) return json({ ok: false, error: "not_signed_in" }, 401);

  // Entitlement gate: each call spends real generation quota, so require a
  // trialing/active account (same bar as the other cost-incurring endpoints).
  if (!(await isEntitled(uid))) {
    return json(
      { ok: false, error: "needs_card", message: "Start your trial to use the script writer." },
      402
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    /* treat as empty */
  }
  const businessName = String(body.businessName || "").trim().slice(0, 120);
  const industry = String(body.industry || "").trim().slice(0, 120);
  if (!businessName || !industry) {
    return json(
      { ok: false, error: "missing_fields", message: "Enter your business name and industry first." },
      400
    );
  }

  const { services, hours } = await clinicDetails(uid);
  const args = { businessName, industry, services, hours };

  // Prefer Claude (reliable) when configured; otherwise Gemini. Whichever runs
  // first, if it FAILS and the other engine is also configured, automatically
  // fall back to it — so a stray/invalid key for one provider can never block
  // generation when the other provider is working.
  let r;
  if (hasClaude()) {
    r = await generateWithClaude(args);
    if (r.error && hasGemini()) {
      const g = await generateReceptionistScript(args);
      r = g.text ? g : { ...g, diag: `${g.diag || g.error}; claudeAlso=${r.error}` };
    }
  } else if (hasGemini()) {
    r = await generateReceptionistScript(args);
    if (r.error && hasClaude()) {
      const c = await generateWithClaude(args);
      r = c.text ? c : { ...r, diag: `${r.diag || r.error}; claudeAlso=${c.error}` };
    }
  } else {
    r = { simulated: true };
  }

  if (r.simulated) return json({ ok: true, simulated: true });
  if (r.error) {
    console.error("[generate-script]", r.engine || "?", r.error, r.diag || "", r.detail || "");
    // Short, non-sensitive reason code (+ engine/diagnostic) so a live setup
    // issue can be pinpointed from the UI. Never includes the key/body.
    const diag = r.diag || (r.engine ? `engine=${r.engine}` : undefined);
    return json(
      {
        ok: false,
        error: "generation_failed",
        reason: r.error,
        diag,
        message: "Couldn't write your script just now — please try again.",
      },
      502
    );
  }
  return json({ ok: true, script: r.text, engine: r.engine || "gemini" });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
