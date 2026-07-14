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
import { hasRetell, getAgent, listCalls } from "../shared/retell-api.mjs";

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

  // --- Retell's own view (the decisive part) --------------------------------
  // Ask Retell directly: is our webhook URL attached to the agent, and does
  // Retell have any record of recent calls? If Retell HAS calls but our DB has
  // none, delivery is the problem — not our code. Non-PII fields only.
  if (hasRetell()) {
    const retell = {};
    const agentId = out.clinics?.list?.length
      ? (await firstAgentId())
      : null;
    if (agentId) {
      try {
        const agent = await getAgent(agentId);
        retell.agent = {
          agent_id: agent.agent_id,
          // THE key fact: is our webhook actually wired onto the agent?
          webhook_url: agent.webhook_url || null,
          webhook_matches_site: agent.webhook_url === out.webhook_url,
        };
      } catch (err) {
        retell.agent_error = ((err && err.message) || String(err)).slice(0, 160);
      }
    }
    try {
      const calls = await listCalls({ limit: 10 });
      const arr = Array.isArray(calls) ? calls : calls?.calls || [];
      retell.calls = {
        total_on_record: arr.length,
        recent: arr.slice(0, 10).map((c) => ({
          id: String(c.call_id || "").slice(-6),
          agent_id: c.agent_id || null,
          status: c.call_status || null,
          start_ts: c.start_timestamp || null,
          disconnect: c.disconnection_reason || null,
        })),
      };
    } catch (err) {
      retell.calls_error = ((err && err.message) || String(err)).slice(0, 160);
    }
    out.retell = retell;
  }

  // --- Self-probe: POST to our OWN webhook the way Retell does -------------
  // Retell delivers call events as a POST to webhook_url. If our domain
  // redirects (apex -> www or vice-versa), the POST is dropped/downgraded and
  // the event never lands — even though a browser GET (this page) works fine.
  // This probes the configured host AND the www/apex sibling so we can SEE a
  // 301/308 redirect (the smoking gun) vs a clean 200. Uses event=call_started,
  // which the webhook intentionally skips — so this writes NO row.
  try {
    const u = new URL(out.webhook_url);
    const sibling = u.hostname.startsWith("www.")
      ? out.webhook_url.replace("://www.", "://")
      : out.webhook_url.replace("://", "://www.");
    const candidates = [out.webhook_url, sibling];
    out.self_probe = {};
    for (const c of candidates) {
      out.self_probe[c] = await probePost(c);
    }
  } catch (err) {
    out.self_probe_error = ((err && err.message) || String(err)).slice(0, 160);
  }

  return json(out);
};

/** The first activated clinic's Retell agent id (for the Retell-side lookup). */
async function firstAgentId() {
  if (!hasSupabase()) return null;
  try {
    const rows = await sbSelect(
      "clinics",
      "select=retell_agent_id&retell_agent_id=not.is.null&limit=1"
    );
    return rows[0]?.retell_agent_id || null;
  } catch {
    return null;
  }
}

/**
 * POST to a URL the way Retell delivers a webhook, and report exactly what
 * happens. `redirect: "manual"` exposes a 3xx (the redirect that would eat the
 * event); the follow pass shows where a POST actually lands (a 301/302 turns
 * the POST into a GET -> our function answers 405, proving the drop).
 */
async function probePost(url) {
  const body = JSON.stringify({
    event: "call_started", // intentionally skipped by the webhook -> writes no row
    call: { call_id: "self_probe", agent_id: "self_probe" },
  });
  const headers = { "content-type": "application/json" };
  const out = {};
  try {
    const r = await fetch(url, {
      method: "POST",
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    out.status = r.status;
    out.redirected_to = r.headers.get("location") || null;
  } catch (err) {
    out.error = ((err && err.message) || String(err)).slice(0, 120);
  }
  try {
    const r2 = await fetch(url, {
      method: "POST",
      headers,
      body,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    out.followed_status = r2.status;
    out.followed_body = (await r2.text()).slice(0, 100);
  } catch (err) {
    out.followed_error = ((err && err.message) || String(err)).slice(0, 120);
  }
  return out;
}

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
