import { useRef, useState } from "react";
import { Play } from "lucide-react";

/**
 * Homepage commercial: a clean poster + play button. The video file is NOT
 * fetched until the visitor presses play (`preload="none"` + src attached on
 * click), so it never weighs down first paint / Speed Index. Renders nothing if
 * the source is removed, so the page can never show a broken player.
 */
const VIDEO_SRC = "/commercial.mp4";
const POSTER_SRC = "/commercial-poster.jpg";

export function VideoDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  if (!VIDEO_SRC) return null;

  const play = () => {
    const el = videoRef.current;
    if (!el) return;
    // Attach the source only now, so nothing downloads until the click.
    if (!el.src) el.src = VIDEO_SRC;
    setStarted(true);
    void el.play();
  };

  return (
    <section className="py-14 lg:py-20">
      <div className="container-page max-w-3xl">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-black shadow-card">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            poster={POSTER_SRC}
            preload="none"
            controls={started}
            playsInline
            onEnded={() => setStarted(false)}
            className="h-full w-full object-cover"
          />

          {/* Poster overlay + play button — hidden once the video starts. */}
          {!started && (
            <button
              type="button"
              onClick={play}
              aria-label="Play the video"
              className="group absolute inset-0 grid place-items-center bg-black/20 transition-colors hover:bg-black/10"
            >
              <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated transition-transform group-hover:scale-105 sm:size-20">
                <Play className="size-7 translate-x-0.5 sm:size-9" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
