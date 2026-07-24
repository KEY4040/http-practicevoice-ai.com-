/**
 * Netlify Function: send-sms
 * ---------------------------------------------------------------------------
 * Sends a single SMS via Twilio. The Twilio Auth Token lives here on the
 * server and is NEVER exposed to the browser.
 *
 * Configure these in Netlify → Site configuration → Environment variables:
 *   TWILIO_ACCOUNT_SID    (starts with "AC…")
 *   TWILIO_AUTH_TOKEN     (secret)
 *   TWILIO_PHONE_NUMBER   (the number texts are sent FROM, e.g. +14155550100)
 *
 * Until those are set, the function responds with { simulated: true } so the
 * UI can show "add your keys" instead of erroring.
 *
 * Request:  POST { to: "+1...", body: "message text" }
 * Response: { ok, sent?, simulated?, sid?, error? }
 */

import { getUserId, bearer, isEntitled } from "../shared/auth.mjs";
import { sbSelect } from "../shared/supabase.mjs";
import { sendSms } from "../shared/sms.mjs";

const digits = (s) => String(s || "").replace(/\D/g, "");

export default async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  // Auth: only a signed-in user may send a (test) text — this endpoint sends
  // from the shared Twilio number, so leaving it open is straight toll-fraud /
  // smishing exposure. The Origin header is NOT a control (absent on non-browser
  // clients), so we verify the Supabase session instead.
  const uid = await getUserId(bearer(req));
  if (!uid) return json({ ok: false, error: "not_signed_in" }, 401);

  // Entitlement: sending SMS costs real money and carries our number's
  // reputation, so require a card-backed subscription (trialing/active). A free,
  // no-card reverse-trial signup must NOT be able to blast texts. Fails closed.
  if (!(await isEntitled(uid))) {
    return json({ ok: false, error: "needs_card" }, 402);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const to = (payload?.to ?? "").trim();
  const body = (payload?.body ?? "").trim();
  if (!to || !body) {
    return json({ ok: false, error: "missing_to_or_body" }, 400);
  }

  // ANTI-ABUSE: this endpoint powers the "send test text" button only — real
  // patient confirmations/reminders go through the webhook + scheduler, not
  // here. So a customer may ONLY text their OWN business number. That makes it
  // impossible to weaponize as a bulk-SMS gun against arbitrary recipients.
  const rows = await sbSelect("clinics", `select=phone&owner_id=eq.${uid}&limit=1`);
  const ownPhone = digits(rows[0]?.phone);
  if (!ownPhone) {
    return json({ ok: false, error: "set_business_phone_first" }, 400);
  }
  const want = digits(to);
  const matches = want.slice(-10) === ownPhone.slice(-10) && ownPhone.length >= 10;
  if (!matches) {
    return json({ ok: false, error: "test_texts_go_to_your_own_number_only" }, 403);
  }

  // Send via the shared helper — it carries the 8s timeout and E.164
  // normalization, and no-ops cleanly ({ simulated }) until Twilio is configured.
  const result = await sendSms(to, body);
  if (result.simulated) {
    return json({ ok: true, simulated: true, reason: "twilio_not_configured" });
  }
  if (result.error) {
    return json({ ok: false, error: result.error }, 502);
  }
  return json({ ok: true, sent: true, sid: result.sid });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
