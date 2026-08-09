import { Phone, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * "Call a live sample" section — a real, dial-able demo agent (a made-up real
 * estate office) so visitors can experience the AI themselves. On mobile the
 * number is a tel: link (tap to call). This is the strongest proof point: hear
 * it live, then know you control how your own is set up.
 */
const SAMPLE_NUMBER_DISPLAY = "1-434-722-3125";
const SAMPLE_NUMBER_TEL = "+14347223125";

export function LiveSample() {
  return (
    <section className="py-14 lg:py-20">
      <div className="container-page max-w-3xl">
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-card to-accent/[0.06] p-6 text-center shadow-card sm:p-10">
          <Badge variant="primary" className="mb-4">
            <PhoneCall className="size-3.5" />
            Try it live
          </Badge>

          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-4xl">
            Don&rsquo;t take our word for it — call a live sample right now
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-muted-foreground">
            This is a sample AI receptionist we set up for a made-up real estate
            office. Call it, ask anything, even give the wrong number on purpose —
            hear how human it sounds and watch it handle the call.
          </p>

          <a
            href={`tel:${SAMPLE_NUMBER_TEL}`}
            className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 text-xl font-bold text-primary-foreground shadow-elevated transition-transform hover:scale-[1.02] sm:text-2xl"
          >
            <Phone className="size-6" />
            {SAMPLE_NUMBER_DISPLAY}
          </a>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Tap to call · answers 24/7 · it&rsquo;s free to try
          </p>

          <p className="mx-auto mt-6 max-w-lg text-sm text-muted-foreground">
            This is just a <strong>sample</strong> so you can see how it works.
            You fully control how your own is set up — your own voice, your hours,
            your services, your VIPs.
          </p>
        </div>
      </div>
    </section>
  );
}
