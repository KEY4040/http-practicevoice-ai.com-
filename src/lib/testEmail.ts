/**
 * Client-side helper to send a test booking-alert email to the signed-in owner's
 * own inbox. POSTs to the `send-test-email` Netlify Function, which holds the
 * email credentials and resolves the recipient from the session (never an
 * arbitrary address). This file just interprets the result for the UI.
 */
export type TestEmailStatus = "sent" | "not_configured" | "demo" | "error";

export interface TestEmailResult {
  status: TestEmailStatus;
  to?: string;
  message?: string;
}

export async function sendTestEmail(): Promise<TestEmailResult> {
  try {
    const { getSupabase } = await import("./supabase");
    const supabase = await getSupabase();
    const token = supabase
      ? (await supabase.auth.getSession()).data.session?.access_token
      : undefined;

    const res = await fetch("/.netlify/functions/send-test-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 401) return { status: "error", message: "Please sign in again." };
    if (res.status === 404) return { status: "demo" };

    const data = (await res.json().catch(() => ({}))) as {
      simulated?: boolean;
      error?: string;
      to?: string;
    };

    if (!res.ok) return { status: "error", message: data.error ?? "Failed to send" };
    if (data.simulated) return { status: "not_configured" };
    return { status: "sent", to: data.to };
  } catch {
    return { status: "demo" };
  }
}
