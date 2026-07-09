/**
 * Netlify Scheduled Function: send-reminders
 * ---------------------------------------------------------------------------
 * Runs hourly and texts patients a reminder ~24 hours before their
 * appointment. No-ops cleanly until Supabase + Twilio are configured.
 *
 * Each run finds appointments scheduled ~23–25h out that haven't been reminded
 * yet, texts the patient, and marks reminder_sent so it only goes once.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *   SMS_REMINDER_TEMPLATE (optional custom wording)
 */
import { hasSupabase, sbSelect, sbUpdate } from "../shared/supabase.mjs";
import {
  sendSms,
  renderTemplate,
  DEFAULT_REMINDER_TEMPLATE,
} from "../shared/sms.mjs";

export const config = { schedule: "@hourly" };

export default async () => {
  if (!hasSupabase()) {
    console.log("[send-reminders] Supabase not configured yet — nothing to do.");
    return new Response("skipped: supabase not configured");
  }

  const now = Date.now();
  const windowStart = new Date(now + 23 * 3600 * 1000).toISOString();
  const windowEnd = new Date(now + 25 * 3600 * 1000).toISOString();

  // Appointments in the ~24h window, not yet reminded, with their clinic name.
  const query =
    `select=id,patient_name,patient_phone,type,provider,scheduled_for,clinics(name)` +
    `&reminder_sent=eq.false` +
    `&scheduled_for=gte.${encodeURIComponent(windowStart)}` +
    `&scheduled_for=lte.${encodeURIComponent(windowEnd)}` +
    `&patient_phone=not.is.null` +
    `&limit=200`;

  let due;
  try {
    due = await sbSelect("appointments", query);
  } catch (err) {
    console.error("[send-reminders] query failed:", err);
    return new Response("error: query failed", { status: 500 });
  }

  const template = process.env.SMS_REMINDER_TEMPLATE || DEFAULT_REMINDER_TEMPLATE;
  let sent = 0;

  for (const appt of due) {
    const body = renderTemplate(template, {
      patient_name: appt.patient_name || "there",
      clinic_name: appt.clinics?.name || "our office",
      service: appt.type || "your appointment",
      appointment_time: formatWhen(appt.scheduled_for),
      provider: appt.provider || "our team",
    });

    const result = await sendSms(appt.patient_phone, body);
    if (result.error) {
      console.error(`[send-reminders] SMS failed for ${appt.id}:`, result.error);
      continue; // leave reminder_sent false so it retries next hour
    }
    // Mark as reminded (also when simulated, so a not-yet-Twilio setup doesn't
    // loop forever once it IS connected — we only reach here on non-error).
    try {
      await sbUpdate("appointments", `id=eq.${encodeURIComponent(appt.id)}`, {
        reminder_sent: true,
      });
      sent += 1;
    } catch (err) {
      console.error(`[send-reminders] mark failed for ${appt.id}:`, err);
    }
  }

  console.log(`[send-reminders] ${due.length} due, ${sent} reminded.`);
  return new Response(`ok: ${sent}/${due.length} reminded`);
};

function formatWhen(iso) {
  if (!iso) return "the scheduled time";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "the scheduled time";
  return d.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
