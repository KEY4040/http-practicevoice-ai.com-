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
    // Attach the signed-in user's token so the server can authorize the send
    // (the endpoint sends from the owner's Twilio number — never leave it open).
    const { getSupabase } = await import("./supabase");
    const supabase = await getSupabase();
    const token = supabase
      ? (await supabase.auth.getSession()).data.session?.access_token
      : undefined;

    const res = await fetch("/.netlify/functions/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ to, body }),
    });

    if (res.status === 401) return { status: "error", message: "Please sign in again." };

    // The function isn't deployed (local dev / preview) — treat as a demo.
    if (res.status === 404) return { status: "demo" };

    const data = (await res.json().catch(() => ({}))) as {
      simulated?: boolean;
      error?: string;
    };

    if (!res.ok) return { status: "error", message: friendlyError(data.error) };
    if (data.simulated) return { status: "not_configured" };
    return { status: "sent" };
  } catch {
    // No backend reachable — demo mode.
    return { status: "demo" };
  }
}

/** Turn a raw backend error code into plain-English guidance for the owner. */
function friendlyError(code?: string): string {
  switch (code) {
    case "test_texts_go_to_your_own_number_only":
      return "For safety, the test only sends to your own business number. Enter the same number as your Practice phone number above.";
    case "set_business_phone_first":
      return "Add your Practice phone number above and save, then send the test.";
    case "needs_card":
      return "Start your trial first to send texts.";
    case "missing_to_or_body":
      return "Enter a phone number to send the test to.";
    default:
      return code ?? "Could not send — please try again.";
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
