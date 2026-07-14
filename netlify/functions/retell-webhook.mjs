/**
 * Netlify Function: retell-webhook
 * ---------------------------------------------------------------------------
 * The endpoint Retell calls when a call ends. Paste this as the webhook URL in
 * Retell (Agent → "Add an inbound webhook"):
 *
 *   https://practicevoice-ai.com/.netlify/functions/retell-webhook
 *
 * On each analyzed call it:
 *   1. Verifies the request is genuinely from Retell (HMAC signature).
 *   2. Finds which clinic the call belongs to.
 *   3. Writes the call (and any booked appointment) into Supabase, so it shows
 *      up in the dashboard.
 *   4. Texts the patient a confirmation when an appointment was booked.
 *
 * Environment variables (Netlify → Site configuration → Environment variables):
 *   RETELL_API_KEY               verify webhook signatures (strongly recommended)
 *   SUPABASE_URL                 your project URL (https://xxxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY    server-only key (bypasses RLS to write calls)
 *   DEFAULT_CLINIC_ID            (single practice) clinic id to attach calls to
 *   DEFAULT_BOOKING_VALUE        (optional) flat $ estimate per booking
 *   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER   confirmations
 *   SMS_CONFIRMATION_TEMPLATE    (optional) custom confirmation wording
 */
import { hasSupabase, sbSelect, sbInsert } from "../shared/supabase.mjs";
import {
  sendSms,
  renderTemplate,
  DEFAULT_CONFIRMATION_TEMPLATE,
} from "../shared/sms.mjs";
import { verifySignature, parseCall } from "../shared/retell.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  // Read the RAW body first — the signature is computed over these exact bytes.
  const raw = await req.text();

  const apiKey = process.env.RETELL_API_KEY;
  const signature =
    req.headers.get("x-retell-signature") || req.headers.get("x-retell-signature-256");
  // ALLOW_UNSIGNED_RETELL is a MASTER bypass: when true it skips the signature
  // check entirely, whether or not the key is set. This is the isolation switch
  // used to prove whether the signature is what's blocking real calls. It must
  // be checked FIRST — a previous version only consulted it when the key was
  // absent, so with the key set the flag silently did nothing. Never leave on.
  if (process.env.ALLOW_UNSIGNED_RETELL === "true") {
    console.warn("[retell-webhook] Signature check DISABLED via ALLOW_UNSIGNED_RETELL.");
  } else if (apiKey) {
    if (!verifySignature(raw, signature, apiKey)) {
      return json({ ok: false, error: "bad_signature" }, 401);
    }
  } else {
    // Fail CLOSED: without the key we cannot prove the request is from Retell,
    // and this function writes to the DB + can send SMS. Reject rather than
    // process forged events.
    console.error(
      "[retell-webhook] RETELL_API_KEY not set — rejecting. Set it (or ALLOW_UNSIGNED_RETELL=true to bypass, not recommended)."
    );
    return json({ ok: false, error: "webhook_not_configured" }, 401);
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Retell fires call_started, call_ended, then call_analyzed. We save on BOTH
  // call_ended (so the call shows up the instant it hangs up) and call_analyzed
  // (which later fills in the summary/booking) — the upsert is idempotent on
  // retell_call_id, so the analyzed event just enriches the same row. Only
  // call_started (no useful data) is skipped.
  const type = event?.event ?? event?.type;
  const call = event?.call ?? event?.data ?? {};
  if (type && type !== "call_analyzed" && type !== "call_ended") {
    return json({ ok: true, skipped: type });
  }

  const parsed = parseCall(call, {
    defaultBookingValue: process.env.DEFAULT_BOOKING_VALUE,
  });

  // Persist to Supabase (if configured).
  let saved = false;
  // Whether this is the FIRST time we've seen this call. Retell delivers
  // at-least-once (and our own 500s trigger retries), so we only text the
  // patient / insert the appointment on the first delivery.
  let isNew = true;
  if (hasSupabase()) {
    try {
      const clinicId = await resolveClinicId(parsed);
      if (!clinicId) {
        // Config problem, not transient — 200 so Retell doesn't keep retrying.
        console.error("[retell-webhook] No clinic matched this call. Set DEFAULT_CLINIC_ID or clinics.retell_number.");
        return json({ ok: false, error: "no_clinic_matched" }, 200);
      }
      const res = await persistCall(clinicId, parsed);
      saved = res.saved;
      isNew = res.isNew;
    } catch (err) {
      // Transient (DB hiccup) — 500 lets Retell retry the delivery. Log only a
      // short, PII-free marker (the DB error body can echo caller/transcript).
      const msg = ((err && err.message) || String(err)).slice(0, 120).replace(/[\r\n]+/g, " ");
      console.error(`[retell-webhook] persist failed: ${msg}`);
      return json({ ok: false, error: "persist_failed" }, 500);
    }
  }

  // Confirmation text — only on a NEW booking, so a redelivered/retried webhook
  // never texts the patient twice.
  if (isNew && parsed.appointment && parsed.appointment.patientPhone) {
    await sendConfirmation(parsed);
  }

  return json({ ok: true, saved, isNew, outcome: parsed.outcome });
};

/**
 * Figure out which clinic this call belongs to.
 *
 * MULTI-TENANT SAFETY: always match on the dialed number / agent id FIRST. A
 * positive per-tenant match must win. DEFAULT_CLINIC_ID is only a last-resort
 * fallback for a single-practice deployment — if it ever "won" first, every
 * tenant's calls (and PHI) would be written to one clinic.
 */
async function resolveClinicId(parsed) {
  const digits = (s) => String(s || "").replace(/\D/g, "");
  // 1. Agent id is the most stable key (survives number reformatting).
  if (parsed.agentId) {
    const byAgent = await sbSelect(
      "clinics",
      `select=id&retell_agent_id=eq.${encodeURIComponent(parsed.agentId)}&limit=1`
    );
    if (byAgent[0]) return byAgent[0].id;
  }
  // 2. The dialed number — try exact, then compare digits-only to survive any
  //    +1 / formatting difference between Retell's to_number and what we stored.
  if (parsed.toNumber) {
    const byNumber = await sbSelect(
      "clinics",
      `select=id&retell_number=eq.${encodeURIComponent(parsed.toNumber)}&limit=1`
    );
    if (byNumber[0]) return byNumber[0].id;
    const wanted = digits(parsed.toNumber);
    if (wanted) {
      const activated = await sbSelect(
        "clinics",
        "select=id,retell_number&retell_number=not.is.null"
      );
      const match = activated.find((c) => digits(c.retell_number).endsWith(wanted) || wanted.endsWith(digits(c.retell_number)));
      if (match) return match.id;
    }
  }
  // 3. Fallbacks when nothing matched. Prefer the single ACTIVATED clinic (one
  //    with a Retell agent) — this covers a lone real customer even if the
  //    agent_id/number drifted — then an explicit env, then a lone clinic.
  const activated = await sbSelect(
    "clinics",
    "select=id&retell_agent_id=not.is.null&limit=2"
  );
  if (activated.length === 1) {
    console.warn(
      `[retell-webhook] fell back to the single activated clinic (agent=${parsed.agentId || "?"} to=${parsed.toNumber || "?"})`
    );
    return activated[0].id;
  }
  const fixed = process.env.DEFAULT_CLINIC_ID;
  if (fixed) return fixed;
  const all = await sbSelect("clinics", "select=id&limit=2");
  if (all.length === 1) return all[0].id;
  console.error(
    `[retell-webhook] no clinic matched (agent=${parsed.agentId || "?"} to=${parsed.toNumber || "?"})`
  );
  return null;
}

/**
 * Insert the call row (idempotent on retell_call_id) and, only on first sight,
 * the appointment. Returns { saved, isNew } so the caller can avoid re-texting
 * the patient on a redelivered webhook.
 */
async function persistCall(clinicId, parsed) {
  // Detect a redelivery BEFORE the upsert so we know whether to add the
  // appointment / send the confirmation.
  let isNew = true;
  if (parsed.retellCallId) {
    const existing = await sbSelect(
      "calls",
      `select=id&retell_call_id=eq.${encodeURIComponent(parsed.retellCallId)}&limit=1`
    );
    isNew = existing.length === 0;
  }

  const callRow = await sbInsert(
    "calls",
    {
      clinic_id: clinicId,
      retell_call_id: parsed.retellCallId,
      caller_name: parsed.callerName,
      caller_phone: parsed.callerPhone,
      started_at: parsed.startedAt ?? undefined,
      duration_sec: parsed.durationSec,
      outcome: parsed.outcome,
      reason: parsed.reason,
      summary: parsed.summary,
      transcript: parsed.transcript,
      revenue: parsed.revenue,
    },
    // Upsert so a duplicate delivery of the same call updates in place.
    parsed.retellCallId ? { onConflict: "retell_call_id" } : undefined
  );

  // Only create the appointment on the first delivery — otherwise a retry would
  // add a duplicate row (and duplicate 24h reminders).
  if (parsed.appointment && callRow?.id && isNew) {
    await sbInsert("appointments", {
      clinic_id: clinicId,
      call_id: callRow.id,
      patient_name: parsed.appointment.patientName,
      patient_phone: parsed.appointment.patientPhone,
      type: parsed.appointment.type,
      provider: parsed.appointment.provider,
      scheduled_for: parsed.appointment.scheduledFor ?? undefined,
    });
  }
  return { saved: true, isNew };
}

/** Text the patient their appointment confirmation. */
async function sendConfirmation(parsed) {
  const appt = parsed.appointment;
  const clinicName = await clinicName_(parsed);
  const template = process.env.SMS_CONFIRMATION_TEMPLATE || DEFAULT_CONFIRMATION_TEMPLATE;
  const body = renderTemplate(template, {
    patient_name: parsed.callerName || "there",
    clinic_name: clinicName,
    service: appt.type || "your appointment",
    appointment_time: appt.whenText || "the scheduled time",
    provider: appt.provider || "our team",
  });
  const result = await sendSms(appt.patientPhone, body);
  // Log the failure without the patient's phone number (PHI).
  if (result.error) console.error("[retell-webhook] confirmation SMS failed (see Twilio logs)");
}

/** Best-effort clinic display name for the SMS (env override → DB → generic). */
async function clinicName_(parsed) {
  if (process.env.CLINIC_NAME) return process.env.CLINIC_NAME;
  try {
    if (process.env.DEFAULT_CLINIC_ID && hasSupabase()) {
      const rows = await sbSelect(
        "clinics",
        `select=name&id=eq.${encodeURIComponent(process.env.DEFAULT_CLINIC_ID)}&limit=1`
      );
      if (rows[0]?.name) return rows[0].name;
    } else if (parsed.toNumber && hasSupabase()) {
      const rows = await sbSelect(
        "clinics",
        `select=name&retell_number=eq.${encodeURIComponent(parsed.toNumber)}&limit=1`
      );
      if (rows[0]?.name) return rows[0].name;
    }
  } catch {
    /* fall through to generic */
  }
  return "our office";
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
