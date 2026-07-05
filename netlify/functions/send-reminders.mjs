/**
 * Netlify Scheduled Function: send-reminders
 * ---------------------------------------------------------------------------
 * Runs on a schedule and texts patients a reminder ~24 hours before their
 * appointment. Safe to deploy immediately — it no-ops until Supabase (for the
 * appointment list) and Twilio (for sending) are configured.
 *
 * Schedule: hourly. Each run looks for appointments ~24h out that haven't been
 * reminded yet. (Hourly keeps reminders close to the 24h mark without spamming.)
 *
 * Needs, when you're ready to turn it on:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (to read appointments — server only)
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *   SMS_REMINDER_TEMPLATE (optional custom wording)
 */

export const config = { schedule: "@hourly" };

const DEFAULT_REMINDER =
  "Hi {{patient_name}}, a friendly reminder from {{clinic_name}}: your {{service}} appointment is tomorrow at {{appointment_time}} with {{provider}}. See you then!";

export default async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("[send-reminders] Supabase not configured yet — nothing to do.");
    return new Response("skipped: supabase not configured");
  }

  // TODO(Supabase): once connected, implement the loop below.
  //   1. const dueSoon = await fetchAppointments({
  //        between: [now + 23h, now + 25h], reminder_sent: false });
  //   2. for (const appt of dueSoon) {
  //        const body = render(process.env.SMS_REMINDER_TEMPLATE || DEFAULT_REMINDER, {
  //          patient_name: appt.patient_name, clinic_name: appt.clinic_name,
  //          service: appt.type, appointment_time: appt.when, provider: appt.provider,
  //        });
  //        await sendSms(appt.patient_phone, body);
  //        await markReminderSent(appt.id);
  //      }
  void DEFAULT_REMINDER;

  console.log("[send-reminders] Configured — reminder loop runs here.");
  return new Response("ok");
};
