/**
 * Client helper to cancel the signed-in owner's subscription. POSTs to the
 * `cancel-subscription` Netlify Function with their access token. Billing stops
 * immediately; the account and its setup are kept (they can resubscribe later).
 */
import { getSupabase } from "./supabase";

export interface CancelResult {
  status: "ok" | "not_signed_in" | "not_configured" | "error" | "demo";
  message?: string;
}

export async function cancelSubscription(): Promise<CancelResult> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return { status: "not_signed_in", message: "Please sign in again." };
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { status: "not_signed_in", message: "Please sign in again." };

    const res = await fetch("/.netlify/functions/cancel-subscription", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 404) return { status: "demo", message: "This works once the site finishes deploying." };

    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
    };

    if (res.status === 503 || body.error === "billing_not_configured") {
      return { status: "not_configured", message: body.message };
    }
    if (!res.ok || !body.ok) {
      return { status: "error", message: body.message || "Couldn't cancel just now — please try again." };
    }
    return { status: "ok" };
  } catch {
    return { status: "demo", message: "This works once the site finishes deploying." };
  }
}
