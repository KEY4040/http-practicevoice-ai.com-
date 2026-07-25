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
      // Append the short diagnostic reason (e.g. status_403) when present.
      const base = data.message ?? "Couldn't generate a script.";
      return { status: "error", message: data.reason ? `${base} (${data.reason})` : base };
    }
    if (data.simulated) return { status: "not_configured" };
    if (data.script) return { status: "ok", script: data.script };
    return { status: "error", message: "No script came back — please try again." };
  } catch {
    return { status: "demo" };
  }
}
