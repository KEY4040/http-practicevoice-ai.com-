/**
 * Client-side helper for the "Instant AI Receptionist" generator. POSTs the
 * business name + industry to the `generate-script` Netlify Function (which holds
 * the generation key server-side) and returns the drafted script for the UI to
 * drop into the "about" box. Fully white-labeled — no provider name anywhere.
 */
export type GenerateScriptStatus = "ok" | "missing" | "not_configured" | "demo" | "error";

export interface GenerateScriptResult {
  status: GenerateScriptStatus;
  script?: string;
  message?: string;
}

/**
 * Turn a raw backend reason code into CUSTOMER-SAFE copy. This is shown in the
 * white-labeled generator, so it must NEVER name a provider or internal infra —
 * only what the customer can do (retry, simplify, or wait). The raw reason stays
 * in the server logs for the operator; it is never surfaced here.
 */
function explainReason(reason?: string): string {
  const code = reason ?? "";
  if (/no_output_SAFETY/.test(code))
    return "Try a simpler industry word (for example “Dental”) and generate again.";
  if (/no_output_MAX_TOKENS/.test(code))
    return "That ran a little long — please try again.";
  if (/status_429/.test(code))
    return "The script writer is busy right now — please try again in a minute.";
  // Everything else (auth/config/model/upstream) is an operator-side setup issue
  // the customer can't act on — keep it neutral and reassuring, no jargon.
  return "The script writer is temporarily unavailable — please try again in a few minutes.";
}

export async function generateScript(
  businessName: string,
  industry: string
): Promise<GenerateScriptResult> {
  try {
    const { getSupabase } = await import("./supabase");
    const supabase = await getSupabase();
    const token = supabase
      ? (await supabase.auth.getSession()).data.session?.access_token
      : undefined;

    const res = await fetch("/.netlify/functions/generate-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ businessName, industry }),
    });

    if (res.status === 401) return { status: "error", message: "Please sign in again." };
    if (res.status === 404) return { status: "demo" };
    if (res.status === 402) {
      const d = (await res.json().catch(() => ({}))) as { message?: string };
      return { status: "error", message: d.message ?? "Start your trial to use the script writer." };
    }

    const data = (await res.json().catch(() => ({}))) as {
      script?: string;
      simulated?: boolean;
      error?: string;
      reason?: string;
      message?: string;
    };

    if (res.status === 400) return { status: "missing", message: data.message };
    if (!res.ok) {
      return { status: "error", message: explainReason(data.reason) };
    }
    if (data.simulated) return { status: "not_configured" };
    if (data.script) return { status: "ok", script: data.script };
    return { status: "error", message: "No script came back — please try again." };
  } catch {
    return { status: "demo" };
  }
}
