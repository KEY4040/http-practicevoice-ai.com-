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

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  // Not configured yet — succeed as a simulation so the front end can explain
  // clearly rather than showing a scary error.
  if (!sid || !token || !from) {
    return json({ ok: true, simulated: true, reason: "twilio_not_configured" });
  }

  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return json({ ok: false, error: data.message ?? "twilio_error" }, res.status);
  }
  return json({ ok: true, sent: true, sid: data.sid });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
