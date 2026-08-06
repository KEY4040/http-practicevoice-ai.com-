/**
 * Client helper for the paid voice-cloning step. Uploads the owner's audio
 * samples to the `clone-voice` Netlify Function (with their access token); the
 * function forwards them to Retell and saves the returned voice_id.
 */
import { getSupabase } from "./supabase";

export interface CloneResult {
  status: "ok" | "not_signed_in" | "not_purchased" | "demo" | "error";
  voiceId?: string;
  previewUrl?: string | null;
  /** True when the cloned voice was applied to a live AI line immediately. */
  applied?: boolean;
  message?: string;
}

/** Send recorded/uploaded audio samples to be cloned. */
export async function cloneVoice(files: File[]): Promise<CloneResult> {
  try {
    const supabase = await getSupabase();
    if (!supabase) return { status: "not_signed_in", message: "Please sign in again." };
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { status: "not_signed_in", message: "Please sign in again." };

    const form = new FormData();
    for (const f of files) form.append("files", f, f.name);

    const res = await fetch("/.netlify/functions/clone-voice", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // no Content-Type: the browser sets the multipart boundary
      body: form,
    });

    if (res.status === 404) return { status: "demo", message: "This works once the site finishes deploying." };

    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
      voice_id?: string;
      preview_audio_url?: string | null;
      applied?: boolean;
    };

    if (res.status === 402 || body.error === "not_purchased") {
      return { status: "not_purchased", message: body.message || "Purchase voice cloning first." };
    }
    if (!res.ok || !body.ok || !body.voice_id) {
      return { status: "error", message: body.message || "Couldn't clone your voice — please try again with clearer audio." };
    }
    return {
      status: "ok",
      voiceId: body.voice_id,
      previewUrl: body.preview_audio_url ?? null,
      applied: Boolean(body.applied),
    };
  } catch {
    return { status: "demo", message: "This works once the site finishes deploying." };
  }
}
