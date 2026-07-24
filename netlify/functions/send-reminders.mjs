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
import { hasSupabase, sbSelect, sbUpdate, getAuthUserEmail } from "../shared/supabase.mjs";
import {
  sendSms,
  renderTemplate,
  DEFAULT_REMINDER_TEMPLATE,
} from "../shared/sms.mjs";
import { sendEmail } from "../shared/email.mjs";
import {
  hasRetell,
  deleteNumber,
  deleteAgent,
  deleteLlm,
  rebindNumber,
} from "../shared/retell-api.mjs";
import { allowanceMinutes, monthStartIso } from "../shared/entitlement.mjs";

export const config = { schedule: "@hourly" };

/**
 * Un-pause any line that was suspended for hitting its minute cap but is now
 * back under allowance — because the month reset (usage clears) or the owner
 * upgraded (allowance rose). Re-attaches the inbound agent and clears the flag.
 */
async function resumeUnderLimitLines(periodStart) {
  if (!hasRetell()) return 0;
  let resumed = 0;
  try {
    const paused = await sbSelect(
      "clinics",
      "select=id,owner_id,retell_number,retell_agent_id,usage_minutes,usage_period_start&usage_suspended=eq.true"
    );
    for (const c of paused) {
      if (!c.retell_number || !c.retell_agent_id) continue;
      const sameMonth =
        c.usage_period_start &&
        new Date(c.usage_period_start).getTime() >= new Date(periodStart).getTime();
      const used = sameMonth ? Number(c.usage_minutes || 0) : 0; // new month -> 0
      let allowance = 0;
      if (c.owner_id) {
        const subs = await sbSelect(
          "subscriptions",
          `select=status,plan,tester_days&user_id=eq.${c.owner_id}&limit=1`
        );
        allowance = allowanceMinutes(subs[0]);
      }
      if (allowance > 0 && used < allowance) {
        await rebindNumber(c.retell_number, c.retell_agent_id).catch(() => {});
        await sbUpdate("clinics", `id=eq.${c.id}`, {
          usage_suspended: false,
          ...(sameMonth ? {} : { usage_minutes: 0, usage_period_start: periodStart }),
        });
        resumed += 1;
        console.log(`[send-reminders] resumed clinic ${c.id} (${used}/${allowance} min)`);
      }
    }
  } catch (e) {
    console.error("[send-reminders] resume sweep failed (non-fatal):", e.message);
  }
  return resumed;
}

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

/**
 * Re-drive booking alerts that never reached the owner — the durable backstop for
 * the webhook's owner alert. Finds recent appointments still flagged
 * owner_notified=false and emails the clinic owner (routed to their own signup
 * email), flipping the flag once the send succeeds (or when there's no address to
 * reach, so it stops retrying). Bounded to the last ~26h. Best-effort, non-fatal.
 */
async function reNotifyPendingBookings(nowMs) {
  let sent = 0;
  try {
    const cutoff = new Date(nowMs - 26 * 3600 * 1000).toISOString();
    const rows = await sbSelect(
      "appointments",
      `select=id,patient_name,patient_phone,type,provider,scheduled_for,clinics(name,owner_id)` +
        `&owner_notified=eq.false&created_at=gte.${encodeURIComponent(cutoff)}&limit=100`
    );
    for (const a of rows) {
      const clinicName = a.clinics?.name || "our office";
      const ownerId = a.clinics?.owner_id || null;
      const ownerEmail = ownerId
        ? await getAuthUserEmail(ownerId)
        : process.env.OWNER_ALERT_EMAIL;
      if (!ownerEmail) {
        // No address to reach — mark notified so this row isn't retried forever.
        await sbUpdate("appointments", `id=eq.${encodeURIComponent(a.id)}`, {
          owner_notified: true,
        }).catch(() => {});
        continue;
      }
      const when = a.scheduled_for
        ? new Date(a.scheduled_for).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "the scheduled time";
      const body = [
        "🟢 NEW APPOINTMENT — booked by your AI receptionist",
        `Practice: ${clinicName}`,
        `Patient: ${a.patient_name || "(not given)"}`,
        `Phone: ${a.patient_phone || "(not given)"}`,
        `Service: ${a.type || "Appointment"}`,
        `When: ${when}`,
        `Provider: ${a.provider || "Our team"}`,
      ].join("\n");
      const r = await sendEmail({
        to: ownerEmail,
        subject: `🟢 New appointment — ${clinicName}`,
        text: body,
      });
      // Flip the flag unless the send explicitly errored — an error leaves it
      // false so the next hourly run retries.
      if (!r?.error) {
        await sbUpdate("appointments", `id=eq.${encodeURIComponent(a.id)}`, {
          owner_notified: true,
        }).catch(() => {});
        sent += 1;
      }
    }
  } catch (e) {
    console.error("[send-reminders] booking re-notify sweep failed (non-fatal):", e.message);
  }
  return sent;
}

export default async () => {
  if (!hasSupabase()) {
    console.log("[send-reminders] Supabase not configured yet — nothing to do.");
    return new Response("skipped: supabase not configured");
  }

  const now = Date.now();
  // Reclaim expired tester lines so they stop billing (independent of reminders).
  await sweepExpiredTesters(new Date(now).toISOString());
  // Un-pause lines that reset (new month) or upgraded back under their allowance.
  await resumeUnderLimitLines(monthStartIso(now));
  // Durable backstop: re-drive any booking alert that never reached the owner
  // (send failed / the webhook function was killed after the appointment saved).
  await reNotifyPendingBookings(now);
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
    // CLAIM the reminder atomically BEFORE sending: flip reminder_sent false->true
    // and only proceed if THIS run won the flip. A concurrent run or a retry can
    // never also send. If the send then fails, we roll the flag back so it's
    // retried next hour — so we never double-text and never silently drop one.
    let claimed = [];
    try {
      claimed = await sbUpdate(
        "appointments",
        `id=eq.${encodeURIComponent(appt.id)}&reminder_sent=eq.false`,
        { reminder_sent: true }
      );
    } catch (err) {
      console.error(`[send-reminders] claim failed for ${appt.id}:`, err);
      continue;
    }
    if (!claimed.length) continue; // already claimed/sent by another run

    const body = renderTemplate(template, {
      patient_name: appt.patient_name || "there",
      clinic_name: appt.clinics?.name || "our office",
      service: appt.type || "your appointment",
      appointment_time: formatWhen(appt.scheduled_for),
      provider: appt.provider || "our team",
    });

    const result = await sendSms(appt.patient_phone, body);
    if (result.error || result.simulated) {
      // Nothing actually went out (Twilio error, or not configured yet) — roll
      // the claim back so this reminder is retried on the next run.
      if (result.error) console.error(`[send-reminders] SMS failed for ${appt.id}:`, result.error);
      await sbUpdate("appointments", `id=eq.${encodeURIComponent(appt.id)}`, {
        reminder_sent: false,
      }).catch((err) => console.error(`[send-reminders] rollback failed for ${appt.id}:`, err));
      continue;
    }
    sent += 1;
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
