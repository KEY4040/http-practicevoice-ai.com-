/**
 * Netlify Function: send-test-email
 * ---------------------------------------------------------------------------
 * Sends a sample "new appointment" alert to the SIGNED-IN owner's own account
 * email, so they can confirm from the dashboard that booking alerts reach their
 * inbox. Auth + entitlement gated (like send-sms) and it can ONLY email the
 * owner's own address (looked up server-side from their session) — never an
 * arbitrary recipient, so it can't be used to send mail to anyone else.
 *
 * Response: { ok, sent?, to?, simulated?, error? }
 */
import { getUserId, bearer, isEntitled } from "../shared/auth.mjs";
import { getAuthUserEmail } from "../shared/supabase.mjs";
import { sendEmail } from "../shared/email.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const uid = await getUserId(bearer(req));
  if (!uid) return json({ ok: false, error: "not_signed_in" }, 401);
  if (!(await isEntitled(uid))) return json({ ok: false, error: "needs_card" }, 402);

  // Recipient is ALWAYS the owner's own account email (server-resolved).
  const to = await getAuthUserEmail(uid);
  if (!to) return json({ ok: false, error: "no_account_email" }, 400);

  const body = [
    "🟢 NEW APPOINTMENT — booked by your AI receptionist",
    "Practice: Your practice",
    "Patient: Test Patient",
    "Phone: +1 (555) 012-3456",
    "Service: Cleaning & Exam",
    "When: Wednesday at 2:30 PM",
    "Provider: Our team",
    "",
    "This is a TEST alert to confirm booking emails reach your inbox. Every real booking your AI makes arrives looking just like this.",
  ].join("\n");

  const r = await sendEmail({
    to,
    subject: "🟢 New appointment — test alert",
    text: body,
  });
  if (r?.simulated) return json({ ok: true, simulated: true, reason: "email_not_configured" });
  if (r?.error) return json({ ok: false, error: r.error }, 502);
  return json({ ok: true, sent: true, to });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
