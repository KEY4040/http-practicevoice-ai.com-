/**
 * Netlify Function: retell-debug
 * ---------------------------------------------------------------------------
 * A read-only status page you can open in a browser to see, at a glance, why
 * calls may or may not be logging — WITHOUT digging through Netlify logs:
 *
 *   https://practicevoice-ai.com/.netlify/functions/retell-debug
 *
 * It reports only non-sensitive aggregates (no caller names/phones/transcripts):
 *   - which server env vars are present (booleans only, never the values)
 *   - whether the signature check is currently bypassed
 *   - how many clinics exist and how many are fully activated (agent + number)
 *   - how many calls are in the database and when the most recent one landed
 *
 * Reading it right after a test call is the fastest way to tell whether Retell
 * is actually delivering webhooks to us: if `calls.total` goes up after a call,
 * delivery + persistence work; if it stays flat, Retell isn't reaching us.
 */
import { hasSupabase, sbSelect } from "../shared/supabase.mjs";

export default async (req) => {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);

  const out = {
    ok: true,
    now: new Date().toISOString(),
    env: {
      supabase: hasSupabase(),
      retell_api_key: Boolean(process.env.RETELL_API_KEY),
      // The isolation switch. If true, the webhook is NOT verifying signatures.
      allow_unsigned_retell: process.env.ALLOW_UNSIGNED_RETELL === "true",
      default_clinic_id: Boolean(process.env.DEFAULT_CLINIC_ID),
      twilio: Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_PHONE_NUMBER
      ),
    },
    webhook_url: `${baseUrl(req)}/.netlify/functions/retell-webhook`,
  };

  if (hasSupabase()) {
    try {
      // Clinics: how many exist, how many are fully wired for inbound calls.
      const clinics = await sbSelect(
        "clinics",
        "select=id,name,retell_agent_id,retell_number,retell_llm_id"
      );
      out.clinics = {
        total: clinics.length,
        activated: clinics.filter((c) => c.retell_agent_id && c.retell_number).length,
        // Names are the owner's own business names (not third-party PII). Include
        // a compact provisioning summary so setup gaps are obvious at a glance.
        list: clinics.map((c) => ({
          name: c.name || "(unnamed)",
          has_agent: Boolean(c.retell_agent_id),
          has_number: Boolean(c.retell_number),
          number: c.retell_number || null,
        })),
      };

      // Calls: the headline number. If this doesn't move after a test call,
      // Retell isn't delivering (or the event was filtered/rejected upstream).
      const recent = await sbSelect(
        "calls",
        "select=started_at,outcome,duration_sec&order=started_at.desc&limit=5"
      );
      const all = await sbSelect("calls", "select=id");
      out.calls = {
        total: all.length,
        latest_at: recent[0]?.started_at || null,
        // Outcome + duration only — deliberately NO caller name/phone/transcript.
        recent: recent.map((c) => ({
          at: c.started_at,
          outcome: c.outcome,
          duration_sec: c.duration_sec,
        })),
      };
    } catch (err) {
      out.ok = false;
      out.db_error = ((err && err.message) || String(err)).slice(0, 160);
    }
  }

  return json(out);
};

function baseUrl(req) {
  const env = process.env.PUBLIC_BASE_URL || process.env.URL;
  if (env) return env.replace(/\/$/, "");
  return `https://${req.headers.get("host")}`;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
