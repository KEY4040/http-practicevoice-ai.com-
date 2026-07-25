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
 * Turn a raw backend reason code (status_403, no_output_SAFETY, …) into a plain
 * fix the owner can act on without needing support. The code is appended in
 * parentheses so it's still identifiable if they do reach out.
 */
function explainReason(reason?: string): string {
  const code = reason ?? "";
  const tag = code ? ` (${code})` : "";
  if (/status_(401|403)/.test(code))
    return `Your AI key was rejected. Create a fresh key at Google AI Studio (aistudio.google.com/apikey) and make sure the “Generative Language API” is enabled for it, then update it in Netlify.${tag}`;
  if (/status_429/.test(code))
    return `The AI is rate-limited right now — wait a minute and try again.${tag}`;
  if (/status_400/.test(code))
    return `The AI key looks malformed — re-paste it in Netlify (no spaces or line breaks), then try again.${tag}`;
  if (/no_output_SAFETY/.test(code))
    return `The AI declined this one — try a simpler industry word (e.g. “Dental” instead of a long phrase).${tag}`;
  if (/status_5\d\d/.test(code))
    return `The AI service had a hiccup — please try again in a moment.${tag}`;
  return `Couldn't write your script just now — please try again.${tag}`;
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
