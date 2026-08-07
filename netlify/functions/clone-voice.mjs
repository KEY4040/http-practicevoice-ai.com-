/**
 * Netlify Function: clone-voice
 * ---------------------------------------------------------------------------
 * The paid one-time voice-cloning step. A signed-in owner who has purchased
 * voice cloning ($59, flagged as clinics.voice_clone_paid by the Stripe webhook)
 * uploads/records a few audio samples; we forward them to Retell's /clone-voice,
 * save the returned voice_id on their clinic, and — if their AI line already
 * exists — switch the live agent to the cloned voice immediately.
 *
 * Auth: Supabase access token (Bearer). Gate: voice_clone_paid must be true, so
 * the browser can never clone for free (the paid flag is server-set only).
 *
 * Env: RETELL_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { hasSupabase, sbSelect, sbUpdate } from "../shared/supabase.mjs";
import { getUserId, bearer } from "../shared/auth.mjs";
import { hasRetell, cloneVoice, updateAgent } from "../shared/retell-api.mjs";

const MAX_FILES = 25; // Retell's ElevenLabs limit
// Netlify synchronous functions reject request bodies around 6 MB at the platform
// (before this handler runs), so keep our own ceiling just under that — this way an
// oversized upload hits the friendly message below instead of an opaque platform 413.
// ~5 MB is plenty of audio for a clone (MediaRecorder is ~1 MB/min).
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!hasSupabase()) return json({ ok: false, error: "supabase_not_configured" }, 500);
  if (!hasRetell())
    return json({ ok: false, error: "retell_not_configured", message: "Voice cloning is temporarily unavailable — we've been notified." }, 503);

  const uid = await getUserId(bearer(req));
  if (!uid) return json({ ok: false, error: "not_signed_in" }, 401);

  const rows = await sbSelect("clinics", `select=*&owner_id=eq.${uid}&limit=1`);
  const clinic = rows[0];
  if (!clinic) return json({ ok: false, error: "no_clinic" }, 404);

  // Paywall: only clone for owners who actually purchased it. The flag is set by
  // the Stripe webhook (server-side) and is NOT browser-writable, so this can't
  // be spoofed from the client.
  if (!clinic.voice_clone_paid) {
    return json(
      { ok: false, error: "not_purchased", message: "Voice cloning hasn't been purchased on this account yet." },
      402
    );
  }

  // Read the uploaded audio out of the multipart body.
  let form;
  try {
    form = await req.formData();
  } catch {
    return json({ ok: false, error: "bad_upload", message: "Couldn't read the uploaded audio." }, 400);
  }

  const entries = form.getAll("files").filter((f) => typeof f === "object" && "arrayBuffer" in f);
  if (!entries.length) {
    return json({ ok: false, error: "no_files", message: "Add at least one clear voice recording." }, 400);
  }
  if (entries.length > MAX_FILES) {
    return json({ ok: false, error: "too_many_files", message: `Please use ${MAX_FILES} recordings or fewer.` }, 400);
  }

  const files = [];
  let total = 0;
  for (const f of entries) {
    const buf = Buffer.from(await f.arrayBuffer());
    total += buf.length;
    if (total > MAX_TOTAL_BYTES) {
      return json({ ok: false, error: "too_large", message: "Your recordings are too large — keep them short (a minute or two total)." }, 413);
    }
    files.push({ data: buf, name: f.name || "sample.mp3", type: f.type || "audio/mpeg" });
  }

  try {
    const voiceName = `${clinic.name || "PracticeVoice"} — cloned`.slice(0, 200);
    const voice = await cloneVoice({ files, voiceName });
    const voiceId = voice?.voice_id;
    if (!voiceId) {
      return json({ ok: false, error: "clone_failed", message: "The clone didn't come back with a voice — please try again with clearer audio." }, 502);
    }

    // Persist the cloned voice on the clinic (service role; server-only column).
    await sbUpdate("clinics", `id=eq.${clinic.id}`, { cloned_voice_id: voiceId });

    // If their AI line is already built, switch it to the cloned voice right now
    // so they don't have to re-activate. Best-effort — the value is saved either
    // way and the next activation will apply it.
    let applied = false;
    if (clinic.retell_agent_id) {
      try {
        await updateAgent(clinic.retell_agent_id, { voiceId });
        applied = true;
      } catch (e) {
        console.error("[clone-voice] agent voice update failed (saved for next activation):", e.message);
      }
    }

    return json({
      ok: true,
      voice_id: voiceId,
      preview_audio_url: voice?.preview_audio_url ?? null,
      applied,
    });
  } catch (e) {
    // Retell payment/limit errors surface as their status so the UI can explain.
    const status = e?.status === 402 ? 402 : e?.status === 429 ? 429 : 502;
    return json({ ok: false, error: "clone_error", message: e.message }, status);
  }
};
