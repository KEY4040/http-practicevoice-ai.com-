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
  if (apiKey) {
    if (!verifySignature(raw, signature, apiKey)) {
      return json({ ok: false, error: "bad_signature" }, 401);
    }
  } else {
    console.warn("[retell-webhook] RETELL_API_KEY not set — skipping signature check.");
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Retell fires call_started, call_ended, then call_analyzed. Act only on the
  // analyzed event so we insert once and have the summary/analysis available.
  const type = event?.event ?? event?.type;
  const call = event?.call ?? event?.data ?? {};
  if (type && type !== "call_analyzed") {
    return json({ ok: true, skipped: type });
  }

  const parsed = parseCall(call, {
    defaultBookingValue: process.env.DEFAULT_BOOKING_VALUE,
  });

  // Persist to Supabase (if configured). Confirmation SMS is sent regardless.
  let saved = false;
  if (hasSupabase()) {
    try {
      const clinicId = await resolveClinicId(parsed);
      if (!clinicId) {
        // Config problem, not transient — 200 so Retell doesn't keep retrying.
        console.error("[retell-webhook] No clinic matched this call. Set DEFAULT_CLINIC_ID or clinics.retell_number.");
        return json({ ok: false, error: "no_clinic_matched" }, 200);
      }
      saved = await persistCall(clinicId, parsed);
    } catch (err) {
      // Transient (DB hiccup) — 500 lets Retell retry the delivery.
      console.error("[retell-webhook] persist failed:", err);
      return json({ ok: false, error: "persist_failed" }, 500);
    }
  }

  // Confirmation text on a booking.
  if (parsed.appointment && parsed.appointment.patientPhone) {
    await sendConfirmation(parsed);
  }

  return json({ ok: true, saved, outcome: parsed.outcome });
};

/** Figure out which clinic this call belongs to. */
async function resolveClinicId(parsed) {
  const fixed = process.env.DEFAULT_CLINIC_ID;
  if (fixed) return fixed;

  // Match on the dialed number, then the agent id.
  if (parsed.toNumber) {
    const byNumber = await sbSelect(
      "clinics",
      `select=id&retell_number=eq.${encodeURIComponent(parsed.toNumber)}&limit=1`
    );
    if (byNumber[0]) return byNumber[0].id;
  }
  if (parsed.agentId) {
    const byAgent = await sbSelect(
      "clinics",
      `select=id&retell_agent_id=eq.${encodeURIComponent(parsed.agentId)}&limit=1`
    );
    if (byAgent[0]) return byAgent[0].id;
  }
  // Single-tenant fallback: if there's exactly one clinic, use it.
  const all = await sbSelect("clinics", "select=id&limit=2");
  return all.length === 1 ? all[0].id : null;
}

/** Insert the call row (idempotent on retell_call_id) and any appointment. */
async function persistCall(clinicId, parsed) {
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

  if (parsed.appointment && callRow?.id) {
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
  return true;
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
  if (result.error) console.error("[retell-webhook] confirmation SMS failed:", result.error);
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
