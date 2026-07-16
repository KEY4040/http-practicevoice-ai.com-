/**
 * Server-side email sender. Provider-agnostic over a simple HTTP API (Resend by
 * default). No-ops (returns { simulated: true }) until an API key is set, so the
 * rest of the pipeline works before email is connected — mirrors sms.mjs.
 *
 * Env:
 *   RESEND_API_KEY     the Resend API key (get one free at resend.com)
 *   EMAIL_FROM         verified from-address, e.g. "PracticeVoice AI <alerts@practicevoice-ai.com>"
 *   OWNER_ALERT_EMAIL  where owner lead alerts go (falls back per-call arg)
 */
export function hasEmail() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { simulated: true };
  if (!to || !subject || (!text && !html)) return { error: "missing_fields" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.message || `email_error_${res.status}` };
    return { sent: true, id: data?.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "email_fetch_failed" };
  }
}
