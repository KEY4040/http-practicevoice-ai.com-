/**
 * Server-side Twilio SMS sender, shared by the webhook and reminder functions.
 * No-ops (returns { simulated: true }) until Twilio env vars are set, so the
 * rest of the pipeline works before Twilio is connected.
 *
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */
/**
 * Best-effort E.164 for US/CA numbers so Twilio accepts what a human typed
 * ("(415) 555-0100" -> "+14155550100"). Already-E.164 input is returned as-is;
 * anything we can't confidently normalize is passed through unchanged (Twilio
 * will reject it and the caller logs the error) rather than mangled.
 */
export function toE164(raw) {
  const s = String(raw || "").trim();
  if (/^\+[1-9]\d{6,14}$/.test(s)) return s; // already valid E.164
  const d = s.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`; // US/CA national
  if (d.length === 11 && d.startsWith("1")) return `+${d}`; // US/CA with country code
  return s;
}

export async function sendSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return { simulated: true };
  if (!to || !body) return { error: "missing_to_or_body" };

  const params = new URLSearchParams({ To: toE164(to), From: from, Body: body });
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.message ?? "twilio_error" };
    return { sent: true, sid: data.sid };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "twilio_fetch_failed" };
  }
}

/** Fill {{tokens}} in a template; unknown tokens are left untouched. */
export function renderTemplate(template, vars) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) =>
    k in vars ? vars[k] : `{{${k}}}`
  );
}

export const DEFAULT_CONFIRMATION_TEMPLATE =
  "Hi {{patient_name}}, this is {{clinic_name}}. Your {{service}} appointment is confirmed for {{appointment_time}} with {{provider}}. Reply STOP to opt out.";

export const DEFAULT_REMINDER_TEMPLATE =
  "Hi {{patient_name}}, a friendly reminder from {{clinic_name}}: your {{service}} appointment is tomorrow at {{appointment_time}} with {{provider}}. See you then!";
