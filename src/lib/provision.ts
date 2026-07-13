/**
 * Client helper to activate the caller's AI receptionist. POSTs to the
 * `activate-agent` Netlify Function with the signed-in user's access token; the
 * function does the Retell provisioning server-side and returns the phone
 * number the owner forwards their business line to.
 */
import { getSupabase } from "./supabase";

export interface ActivateResult {
  status: "created" | "updated" | "error" | "demo";
  /** The AI number to forward calls to (may be null if the number step failed). */
  number?: string | null;
  message?: string;
}

export async function activateAiLine(): Promise<ActivateResult> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return { status: "error", message: "Not signed in." };
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { status: "error", message: "Please sign in again." };

    const res = await fetch("/.netlify/functions/activate-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: "{}",
    });

    if (res.status === 404) return { status: "demo" };

    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      status?: string;
      number?: string | null;
      message?: string;
      numberError?: string;
      error?: string;
    };

    if (!res.ok || !body.ok) {
      return {
        status: "error",
        message: body.message || body.error || "Activation failed. Try again.",
      };
    }
    return {
      status: body.status === "updated" ? "updated" : "created",
      number: body.number ?? null,
      message: body.numberError
        ? "Your AI is built, but getting a phone number failed — add a payment method / balance in Retell, then activate again."
        : undefined,
    };
  } catch {
    return { status: "demo" };
  }
}
