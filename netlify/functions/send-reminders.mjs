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
import { hasRetell, deleteNumber, deleteAgent, deleteLlm } from "../shared/retell-api.mjs";

export const config = { schedule: "@hourly" };

/**
 * Reclaim the Retell line of any TESTER account whose window has expired, so a
 * time-boxed tester's provisioned number stops billing after lockout. Only
 * touches tester rows (tester_days set) with no Stripe customer — real paying
 * customers are handled by the Stripe webhook. Best-effort + non-fatal.
 */
async function sweepExpiredTesters(nowIso) {
  if (!hasRetell()) return 0;
  let torn = 0;
  try {
    const expired = await sbSelect(
      "subscriptions",
      `select=user_id&tester_days=not.is.null&stripe_customer_id=is.null` +
        `&access_expires_at=not.is.null&access_expires_at=lt.${encodeURIComponent(nowIso)}`
    );
    for (const sub of expired) {
      const clinics = await sbSelect(
        "clinics",
        `select=id,retell_number,retell_agent_id,retell_llm_id&owner_id=eq.${sub.user_id}&retell_number=not.is.null&limit=1`
      );
      const clinic = clinics[0];
      if (!clinic) continue; // nothing provisioned (or already reclaimed)
      if (clinic.retell_number) await deleteNumber(clinic.retell_number).catch(() => {});
      if (clinic.retell_agent_id) await deleteAgent(clinic.retell_agent_id).catch(() => {});
      if (clinic.retell_llm_id) await deleteLlm(clinic.retell_llm_id).catch(() => {});
      await sbUpdate("clinics", `id=eq.${clinic.id}`, {
        retell_number: null,
        retell_agent_id: null,
        retell_llm_id: null,
      });
      torn += 1;
      console.log(`[send-reminders] reclaimed expired tester line for clinic ${clinic.id}`);
    }
  } catch (e) {
    console.error("[send-reminders] tester sweep failed (non-fatal):", e.message);
  }
  return torn;
}

export default async () => {
  if (!hasSupabase()) {
    console.log("[send-reminders] Supabase not configured yet — nothing to do.");
    return new Response("skipped: supabase not configured");
  }

  const now = Date.now();
  // Reclaim expired tester lines so they stop billing (independent of reminders).
  await sweepExpiredTesters(new Date(now).toISOString());
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
    if (result.simulated) {
      // Twilio isn't configured yet — do NOT mark as reminded, otherwise these
      // patients would be silently skipped once Twilio is connected.
      continue;
    }
    // A real text went out — mark it so we only remind once.
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
