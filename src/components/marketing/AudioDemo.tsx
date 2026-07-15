import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * "Hear a real call" homepage section with a clean, on-brand audio player.
 *
 * Renders ONLY when a real recording is present. Drop the file at
 * `public/demo-call.wav` (a genuine call from the AI line — never fabricated)
 * and point DEMO_AUDIO_SRC at it. Empty string = section renders nothing, so
 * the homepage never shows a broken player.
 */
const DEMO_AUDIO_SRC = "/demo-call.wav"; // real recording of the AI taking a live call

function fmt(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioDemo() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  if (!DEMO_AUDIO_SRC) return null;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const t = Number(e.target.value);
    el.currentTime = t;
    setCurrent(t);
  };

  const pct = duration ? (current / duration) * 100 : 0;

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

        <div className="mx-auto mt-8 flex max-w-lg items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:gap-5 sm:p-5">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 sm:size-14"
          >
            {playing ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={current}
              onChange={seek}
              aria-label="Seek"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--muted)) ${pct}%)`,
              }}
            />
            <div className="mt-2 flex justify-between text-xs font-medium tabular-nums text-muted-foreground">
              <span>{fmt(current)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Real call · captured live by PracticeVoice AI
        </p>

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio
          ref={audioRef}
          src={DEMO_AUDIO_SRC}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      </div>
    </section>
  );
}
