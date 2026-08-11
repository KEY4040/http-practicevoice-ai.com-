import { Phone } from "lucide-react";

/**
 * The single "experience the sample" section: a premium dark card whose only
 * call to action is dialing the live sample line (a real, made-up real-estate
 * demo agent). On mobile the number is a tel: link (tap to call). There is no
 * audio player anymore — visitors experience the AI by calling it live.
 */
const SAMPLE_NUMBER_DISPLAY = "1-434-722-3125";
const SAMPLE_NUMBER_TEL = "+14347223125";

// Gold gradient reused for the monogram and the "live call" accent.
const GOLD = "linear-gradient(180deg,#f7e2a0 0%,#d9b551 48%,#b8860b 100%)";

export function LiveSample() {
  return (
    <section className="py-14 lg:py-20">
      <div className="container-page max-w-3xl">
        {/* Premium dark "live call" card — the only sample experience. */}
        <div
          className="relative overflow-hidden rounded-[1.75rem] px-6 py-12 text-center sm:px-10 sm:py-14"
          style={{
            background:
              "linear-gradient(135deg,#0b1a33 0%,#0a1428 55%,#0e1f3d 100%)",
            boxShadow:
              "0 25px 60px -20px rgba(0,0,0,.7), 0 0 70px -30px rgba(212,175,55,.45)",
          }}
        >
          {/* Gold hairline frame, echoing the luxury card look. */}
          <div className="pointer-events-none absolute inset-3 rounded-[1.4rem] ring-1 ring-[#d4af37]/30" />

          {/* PV gold monogram */}
          <div
            className="mx-auto mb-5 w-fit select-none bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl"
            style={{ backgroundImage: GOLD }}
          >
            PV
          </div>

          <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Hear the AI answer a{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: GOLD }}
            >
              live call
            </span>
          </h2>

          <a
            href={`tel:${SAMPLE_NUMBER_TEL}`}
            className="mt-8 inline-flex items-center gap-3 rounded-2xl px-7 py-4 text-base font-bold text-white transition-transform hover:scale-[1.02] sm:text-xl"
            style={{
              background: "linear-gradient(180deg,#3b82f6 0%,#1d4ed8 100%)",
              boxShadow:
                "0 0 30px -4px rgba(59,130,246,.8), inset 0 1px 0 rgba(255,255,255,.25)",
            }}
          >
            <Phone className="size-5 shrink-0" />
            Call the Live Sample · {SAMPLE_NUMBER_DISPLAY}
          </a>
          <p className="mt-3 text-xs font-medium text-white/60">
            Tap to call · answers 24/7 · it&rsquo;s free to try
          </p>
        </div>

        {/* Supporting copy (kept from before) — the card above is the CTA. */}
        <div className="mx-auto mt-8 max-w-xl text-center">
          <h3 className="text-balance text-xl font-bold tracking-tight sm:text-2xl">
            Don&rsquo;t take our word for it — call a live sample right now
          </h3>
          <p className="mt-3 text-muted-foreground">
            This is a sample AI receptionist we set up for a made-up real estate
            office. Call it, ask anything, even give the wrong number on purpose —
            hear how human it sounds and watch it handle the call.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            This is just a <strong>sample</strong> so you can see how it works. You
            fully control how your own is set up — your own voice, your hours, your
            services, your VIPs.
          </p>
        </div>
      </div>
    </section>
  );
}
