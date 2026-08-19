/**
 * Client helper to open the Stripe Billing Portal for the signed-in owner.
 * POSTs to the `billing-portal` Netlify Function with their access token and
 * returns the one-time Stripe URL to redirect to (update card, change plan,
 * download invoices).
 */
import { getSupabase } from "./supabase";

export interface PortalResult {
  status: "ok" | "not_signed_in" | "not_configured" | "no_customer" | "error" | "demo";
  url?: string;
  message?: string;
}

export async function openBillingPortal(): Promise<PortalResult> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return { status: "not_signed_in", message: "Please sign in again." };
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { status: "not_signed_in", message: "Please sign in again." };

    const res = await fetch("/.netlify/functions/billing-portal", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 404) return { status: "demo", message: "This works once the site finishes deploying." };

    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      url?: string;
      error?: string;
      message?: string;
    };

    if (res.status === 503 || body.error === "billing_not_configured") {
      return { status: "not_configured", message: body.message };
    }
    if (body.error === "no_customer") {
      return { status: "no_customer", message: body.message };
    }
    if (!res.ok || !body.ok || !body.url) {
      return { status: "error", message: body.message || "Couldn't open billing just now — please try again." };
    }
    return { status: "ok", url: body.url };
  } catch {
    return { status: "demo", message: "This works once the site finishes deploying." };
  }
}
