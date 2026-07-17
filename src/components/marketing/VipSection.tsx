import { Link } from "react-router-dom";
import { Star, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * VIP Passthrough section — hybrid: native heading/CTA (crawlable, crisp on all
 * screens) with the polished marketing graphic as the visual centerpiece.
 */
export function VipSection() {
  return (
    <section id="vip" className="scroll-mt-20 border-y border-border bg-muted/30 py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            <Star className="size-3.5" />
            VIP Passthrough
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Your people reach <span className="gradient-text">you</span>. Everyone
            else gets handled.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-muted-foreground">
            Run your business from your cell? Add the numbers that matter — family,
            top clients, your crew — and they ring <strong>straight through to
            you</strong>. New callers get your AI receptionist. Nobody important
            ever gets a bot.
          </p>
        </div>

        <picture className="contents">
          <source srcSet="/showcase-vip.webp" type="image/webp" />
          <img
            src="/showcase-vip.jpg"
            alt="VIP Passthrough: a VIP contact list where Mom, top clients, and partners ring straight to your cell, while unknown callers are answered by the AI receptionist that books the appointment."
            loading="lazy"
            width={1792}
            height={1008}
            className="mx-auto mt-12 w-full max-w-4xl rounded-2xl border border-border shadow-elevated"
          />
        </picture>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/pricing">
              Start — $9.99 for 14 days
              <ArrowRight />
            </Link>
          </Button>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-accent" />
            One number for business — keep your circle human.
          </span>
        </div>
      </div>
    </section>
  );
}
