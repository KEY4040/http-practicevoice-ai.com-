/**
 * Netlify Function: retell-repair
 * ---------------------------------------------------------------------------
 * One-tap fix for the #1 reason calls don't log: the Retell agent has no
 * `webhook_url`, so Retell records the call but never delivers it to us.
 *
 *   https://practicevoice-ai.com/.netlify/functions/retell-repair
 *
 * For every activated clinic it PATCHes the agent's webhook_url to this site's
 * retell-webhook endpoint and reports the before/after. Idempotent — safe to
 * run repeatedly; if the URL is already correct it's a harmless no-op.
 *
 * Read-only-ish: it only ever sets the webhook_url to OUR canonical endpoint;
 * it can't point an agent anywhere else. No caller PII is touched or returned.
 */
import { hasSupabase, sbSelect } from "../shared/supabase.mjs";
import { hasRetell, getAgent, updateAgent } from "../shared/retell-api.mjs";

export default async (req) => {
  if (!hasSupabase()) return json({ ok: false, error: "supabase_not_configured" }, 500);
  if (!hasRetell()) return json({ ok: false, error: "retell_not_configured" }, 503);

  const webhookUrl = `${baseUrl(req)}/.netlify/functions/retell-webhook`;

  const clinics = await sbSelect(
    "clinics",
    "select=name,retell_agent_id&retell_agent_id=not.is.null"
  );
  if (!clinics.length) {
    return json({ ok: false, error: "no_activated_clinics", webhookUrl }, 200);
  }

  const results = [];
  for (const c of clinics) {
    const entry = { clinic: c.name || "(unnamed)", agent_id: c.retell_agent_id };
    try {
      const before = await getAgent(c.retell_agent_id);
      entry.before_webhook_url = before.webhook_url || null;
      await updateAgent(c.retell_agent_id, { webhookUrl });
      const after = await getAgent(c.retell_agent_id);
      entry.after_webhook_url = after.webhook_url || null;
      entry.fixed = after.webhook_url === webhookUrl;
    } catch (err) {
      entry.error = ((err && err.message) || String(err)).slice(0, 160);
    }
    results.push(entry);
  }

  return json({ ok: true, webhookUrl, agents: results });
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
