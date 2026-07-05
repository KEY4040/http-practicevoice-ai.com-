/**
 * Client-side SMS helper.
 *
 * Never talks to Twilio directly — the Auth Token must stay on the server. It
 * POSTs to the `send-sms` Netlify Function, which holds the credentials. This
 * file just interprets the result for the UI.
 */

export type SmsStatus = "sent" | "not_configured" | "demo" | "error";

export interface SmsResult {
  status: SmsStatus;
  message?: string;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  try {
    const res = await fetch("/.netlify/functions/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, body }),
    });

    // The function isn't deployed (local dev / preview) — treat as a demo.
    if (res.status === 404) return { status: "demo" };

    const data = (await res.json().catch(() => ({}))) as {
      simulated?: boolean;
      error?: string;
    };

    if (!res.ok) return { status: "error", message: data.error ?? "Failed to send" };
    if (data.simulated) return { status: "not_configured" };
    return { status: "sent" };
  } catch {
    // No backend reachable — demo mode.
    return { status: "demo" };
  }
}

/** Human-readable result for inline UI feedback. */
export function describeSmsResult(result: SmsResult): string {
  switch (result.status) {
    case "sent":
      return "Text sent ✓";
    case "not_configured":
      return "Add your Twilio keys in Netlify to send for real";
    case "demo":
      return "Demo — text would send once deployed with Twilio";
    case "error":
      return result.message ?? "Could not send";
  }
}
