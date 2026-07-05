/**
 * Netlify Function: retell-webhook
 * ---------------------------------------------------------------------------
 * Receives call events from Retell AI (your voice agent). This is the endpoint
 * you paste into Retell's dashboard as the webhook URL:
 *
 *   https://practicevoice-ai.com/.netlify/functions/retell-webhook
 *
 * What it's built to do (the SMS-on-booking half is wired; the database half is
 * marked TODO because it needs Supabase):
 *   1. When a call ends with a booked appointment, send the patient a
 *      confirmation text (via Twilio, reusing the same send path as send-sms).
 *   2. (TODO once Supabase is connected) Save the call + appointment + the
 *      patient's phone number so it shows in the dashboard and can be reminded.
 *
 * Optional env var to customize the confirmation wording server-side:
 *   SMS_CONFIRMATION_TEMPLATE (defaults to the same text as the app)
 */

const DEFAULT_CONFIRMATION =
  "Hi {{patient_name}}, this is {{clinic_name}}. Your {{service}} appointment is confirmed for {{appointment_time}} with {{provider}}. Reply STOP to opt out.";

export default async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  // SECURITY TODO before production: verify this request is genuinely from
  // Retell. Retell can sign webhooks — check the signature header against
  // RETELL_WEBHOOK_SECRET here and reject anything that doesn't match, so no one
  // can POST fake "booking" events to trigger texts.

  let event;
  try {
    event = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Retell sends different event types; we only act on a completed call that
  // resulted in a booking. Adjust the field mapping to match your Retell agent's
  // configured output/analysis schema.
  const call = event?.call ?? event?.data ?? event ?? {};
  const booking = call.appointment ?? call.booking ?? null;
  const patientPhone = call.from_number ?? call.caller_phone ?? booking?.phone;

  // TODO(Supabase): insert the call + appointment rows here so the dashboard
  // reflects real data and the reminder job can find this appointment later.

  // Send the confirmation text if we have a booking + a phone number.
  if (booking && patientPhone) {
    const template = process.env.SMS_CONFIRMATION_TEMPLATE || DEFAULT_CONFIRMATION;
    const body = render(template, {
      patient_name: call.patient_name ?? call.caller_name ?? "there",
      clinic_name: process.env.CLINIC_NAME ?? "our office",
      service: booking.type ?? booking.service ?? "your appointment",
      appointment_time: booking.when ?? booking.time ?? "the scheduled time",
      provider: booking.provider ?? "our team",
    });
    await sendSms(patientPhone, body);
  }

  // Always 200 so Retell doesn't retry a handled event.
  return json({ ok: true });
};

/** Send an SMS via Twilio (same approach as send-sms.mjs). No-ops if unset. */
async function sendSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return; // not configured yet

  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  }).catch(() => {
    /* swallow — Retell shouldn't retry because a text failed */
  });
}

function render(template, vars) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) =>
    k in vars ? vars[k] : `{{${k}}}`
  );
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
