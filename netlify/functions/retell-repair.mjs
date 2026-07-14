/**
 * Netlify Function: retell-repair
 * ---------------------------------------------------------------------------
 * Open in a browser to repair the Retell wiring for every activated clinic and
 * prove the call-logging pipeline end to end:
 *
 *   https://practicevoice-ai.com/.netlify/functions/retell-repair
 *
 * For each activated clinic it:
 *   1. Ensures the AGENT's webhook_url points at our event handler (call events
 *      are delivered here).
 *   2. Clears the NUMBER's inbound_webhook_url — a call-START routing hook that
 *      does NOT deliver call events and puts inbound calls on the dynamic path.
 *   3. Injects a realistic call_ended into our own webhook so a test call
 *      appears on the dashboard, proving persistence works with real-shaped data.
 *
 * Idempotent — safe to run repeatedly. No third-party caller PII is touched.
 */
import { hasSupabase, sbSelect } from "../shared/supabase.mjs";
import { debugAuthorized } from "../shared/auth.mjs";
import {
  hasRetell,
  getAgent,
  updateAgent,
  getPhoneNumber,
  updatePhoneNumber,
} from "../shared/retell-api.mjs";

export default async (req) => {
  // Mutating + injects rows -> never public. Requires ?token=<DEBUG_TOKEN>.
  if (!debugAuthorized(req)) {
    return json(
      { ok: false, error: "forbidden", hint: "Set DEBUG_TOKEN and call with ?token=…" },
      403
    );
  }
  if (!hasSupabase()) return json({ ok: false, error: "supabase_not_configured" }, 500);
  if (!hasRetell()) return json({ ok: false, error: "retell_not_configured" }, 503);

  const webhookUrl = `${baseUrl(req)}/.netlify/functions/retell-webhook`;

  const clinics = await sbSelect(
    "clinics",
    "select=name,retell_agent_id,retell_number&retell_agent_id=not.is.null"
  );
  if (!clinics.length) {
    return json({ ok: false, error: "no_activated_clinics", webhookUrl }, 200);
  }

  const results = [];
  for (const c of clinics) {
    const entry = { clinic: c.name || "(unnamed)", agent_id: c.retell_agent_id };

    // 1. Agent webhook_url — where call events are delivered.
    try {
      const before = await getAgent(c.retell_agent_id);
      entry.agent_webhook_before = before.webhook_url || null;
      await updateAgent(c.retell_agent_id, { webhookUrl });
      const after = await getAgent(c.retell_agent_id);
      entry.agent_webhook_after = after.webhook_url || null;
    } catch (err) {
      entry.agent_error = short(err);
    }

    // 2. Clear the number's inbound_webhook_url (the routing hook).
    if (c.retell_number) {
      try {
        const before = await getPhoneNumber(c.retell_number);
        entry.number_inbound_webhook_before = before.inbound_webhook_url || null;
        if (before.inbound_webhook_url) {
          await updatePhoneNumber(c.retell_number, { inbound_webhook_url: null });
          const after = await getPhoneNumber(c.retell_number);
          entry.number_inbound_webhook_after = after.inbound_webhook_url || null;
          entry.cleared = !after.inbound_webhook_url;
        } else {
          entry.number_inbound_webhook_after = null;
          entry.cleared = "already_clear";
        }
      } catch (err) {
        entry.number_error = short(err);
      }
    }

    results.push(entry);
  }

  // 3. Inject a realistic call_ended into our own webhook, so a test call lands
  //    on the dashboard and we PROVE the pipeline persists real-shaped data.
  const probeClinic = clinics[0];
  const testCallId = `pv_selftest_${Date.now()}`;
  const now = Date.now();
  const testEvent = {
    event: "call_ended",
    call: {
      call_id: testCallId,
      agent_id: probeClinic.retell_agent_id,
      to_number: probeClinic.retell_number || null,
      from_number: "+10000000000",
      start_timestamp: now - 25000,
      end_timestamp: now,
      duration_ms: 25000,
      call_status: "ended",
      transcript:
        "Agent: Thank you for calling.\nUser: This is a PracticeVoice system self-test to confirm call logging works.",
      call_analysis: {
        call_summary:
          "PracticeVoice self-test — this is a system connectivity check, not a real caller. Safe to ignore or delete.",
        in_voicemail: false,
        custom_analysis_data: {},
      },
    },
  };
  const selfTest = { call_id: testCallId, posted_to: webhookUrl };
  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(testEvent),
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    selfTest.status = r.status;
    selfTest.response = (await r.text()).slice(0, 200);
    // Did the row actually land?
    const rows = await sbSelect(
      "calls",
      `select=id&retell_call_id=eq.${encodeURIComponent(testCallId)}&limit=1`
    );
    selfTest.row_created = rows.length > 0;
  } catch (err) {
    selfTest.error = short(err);
  }

  return json({
    ok: true,
    webhookUrl,
    agents: results,
    self_test: selfTest,
    note:
      selfTest.row_created === true
        ? "PIPELINE PROVEN: a test call was written and should appear on the dashboard. If REAL calls still don't log, the issue is purely Retell delivery."
        : "Self-test did NOT create a row — inspect self_test.response for why.",
  });
};

function short(err) {
  return ((err && err.message) || String(err)).slice(0, 160);
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
