/**
 * Client helper for canceling the subscription and deleting the account. POSTs
 * to the `cancel-account` Netlify Function with the signed-in user's token; the
 * function cancels Stripe, tears down Retell, and deletes the account.
 */
import { getSupabase } from "./supabase";

export interface CancelResult {
  status: "ok" | "not_signed_in" | "not_configured" | "error" | "demo";
  message?: string;
}

export async function cancelAccount(): Promise<CancelResult> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return { status: "not_signed_in", message: "Please sign in again." };
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { status: "not_signed_in", message: "Please sign in again." };

    const res = await fetch("/.netlify/functions/cancel-account", {
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
