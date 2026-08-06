import { useRef, useState } from "react";
import { Mic, Sparkles, Upload, X, Check, Loader2, Square } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cloneVoice } from "@/lib/voiceClone";
import { VOICE_CLONE_PRICE, VOICE_CLONE_PAYMENT_LINK } from "@/data/voiceClone";

interface VoiceCloneCardProps {
  paid: boolean;
  clonedVoiceId: string | null;
  userId?: string;
  email?: string;
  /** Called after a successful clone so the parent can reflect the new state. */
  onCloned: (voiceId: string) => void;
}

/** Build the one-time checkout URL, carrying identity so the webhook maps it back. */
function buyUrl(userId?: string, email?: string): string {
  if (!VOICE_CLONE_PAYMENT_LINK) return "";
  try {
    const url = new URL(VOICE_CLONE_PAYMENT_LINK);
    if (userId) url.searchParams.set("client_reference_id", userId);
    if (email) url.searchParams.set("prefilled_email", email);
    return url.toString();
  } catch {
    return VOICE_CLONE_PAYMENT_LINK;
  }
}

export function VoiceCloneCard({ paid, clonedVoiceId, userId, email, onCloned }: VoiceCloneCardProps) {
  const [samples, setSamples] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ applied: boolean } | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const header = (
    <CardHeader>
      <CardTitle className="flex flex-wrap items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        Clone your own voice
        <Badge variant="neutral">One-time ${VOICE_CLONE_PRICE}</Badge>
      </CardTitle>
      <CardDescription>
        Make your AI receptionist sound like <strong>you</strong>. A single ${VOICE_CLONE_PRICE}{" "}
        payment — no monthly fee. Record a short sample and your line speaks in your voice.
      </CardDescription>
    </CardHeader>
  );

  // ---- Already cloned ----
  if (clonedVoiceId) {
    return (
      <Card>
        {header}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/[0.05] p-4 text-sm">
            <Check className="size-4 shrink-0 text-accent-hover" />
            <span>
              Your cloned voice is active. It's used whenever your AI line is built — tap{" "}
              <strong>Activate my AI line</strong> if you just set it up.
            </span>
          </div>
          {paid && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                Re-record and replace it
              </summary>
              <div className="mt-3">{recorder()}</div>
            </details>
          )}
        </div>
      </Card>
    );
  }

  // ---- Not purchased ----
  if (!paid) {
    const url = buyUrl(userId, email);
    return (
      <Card>
        {header}
        <div className="px-6 pb-6">
          <ul className="mb-4 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Your real voice answering every call</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />One flat ${VOICE_CLONE_PRICE} — never a monthly charge</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Takes about a minute to set up after you pay</li>
          </ul>
          {url ? (
            <Button asChild variant="primary">
              <a href={url}>
                <Sparkles className="size-4" />
                Clone my voice — ${VOICE_CLONE_PRICE} one-time
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Voice cloning is being set up — check back shortly.
            </p>
          )}
        </div>
      </Card>
    );
  }

  // ---- Paid, not yet cloned ----
  return (
    <Card>
      {header}
      <div className="px-6 pb-6">
        <div className="mb-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-3 text-xs text-muted-foreground">
          Tip: in a quiet room, read a paragraph naturally for about 30–60 seconds. Clear
          audio makes the best clone. You can record here or upload an audio file.
        </div>
        {recorder()}
      </div>
    </Card>
  );

  // ---- Shared recorder/upload UI ----
  function recorder() {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {recording ? (
            <Button type="button" variant="destructive" onClick={stopRecording}>
              <Square className="size-4" />
              Stop recording
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={startRecording}>
              <Mic className="size-4" />
              Record a sample
            </Button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold hover:bg-muted">
            <Upload className="size-4" />
            Upload audio
            <input
              type="file"
              accept="audio/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                if (list.length) setSamples((prev) => [...prev, ...list].slice(0, 25));
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {samples.length > 0 && (
          <ul className="space-y-1.5">
            {samples.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
              >
                <span className="truncate">{f.name || `Recording ${i + 1}`}</span>
                <button
                  type="button"
                  onClick={() => setSamples((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Remove sample"
                  className="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3">
          <Button type="button" variant="primary" onClick={submit} disabled={busy || samples.length === 0}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? "Cloning your voice…" : "Clone my voice"}
          </Button>
          {done && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-hover">
              <Check className="size-4" />
              {done.applied ? "Done — your line now speaks in your voice." : "Cloned — activate your AI line to apply it."}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  async function startRecording() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording isn't supported on this browser — upload an audio file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const ext = (rec.mimeType || "audio/webm").includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `recording-${samples.length + 1}.${ext}`, { type: blob.type });
        setSamples((prev) => [...prev, file].slice(0, 25));
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Couldn't access your microphone. Check permissions, or upload an audio file instead.");
    }
  }

  function stopRecording() {
    try {
      recorderRef.current?.stop();
    } finally {
      setRecording(false);
    }
  }

  async function submit() {
    if (!samples.length || busy) return;
    setBusy(true);
    setError(null);
    setDone(null);
    const r = await cloneVoice(samples);
    setBusy(false);
    if (r.status === "ok" && r.voiceId) {
      setDone({ applied: Boolean(r.applied) });
      setSamples([]);
      onCloned(r.voiceId);
    } else {
      setError(r.message || "Couldn't clone your voice — please try again.");
    }
  }
}
