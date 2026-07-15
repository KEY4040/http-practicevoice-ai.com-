import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * "Hear a real call" homepage section.
 *
 * This renders ONLY when a real recording is present. Drop an MP3 at
 * `public/demo-call.mp3` (a genuine 30–45s call from your own AI line — never a
 * fabricated one) and flip DEMO_AUDIO_SRC below to "/demo-call.mp3". Until then
 * the section renders nothing, so the homepage never shows a broken player.
 */
const DEMO_AUDIO_SRC = "/demo-call.wav"; // real recording of the AI taking a live call

export function AudioDemo() {
  if (!DEMO_AUDIO_SRC) return null;

  return (
    <section className="border-y border-border bg-muted/30 py-16 lg:py-20">
      <div className="container-page max-w-2xl text-center">
        <Badge variant="primary" className="mb-4">
          <Play className="size-3.5" />
          Hear it for yourself
        </Badge>
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          A real call, answered by the AI
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-balance text-muted-foreground">
          No script, no actor — this is our AI receptionist taking a real inbound
          call, calming the caller, and capturing everything the business needs.
          Press play.
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls preload="none" className="w-full" src={DEMO_AUDIO_SRC}>
            Your browser doesn't support audio playback.
          </audio>
        </div>
      </div>
    </section>
  );
}
