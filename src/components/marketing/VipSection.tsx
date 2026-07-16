import { Link } from "react-router-dom";
import { Star, PhoneCall, Bot, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * VIP Passthrough marketing section — native + responsive (no baked-in image
 * text, so it stays crisp on mobile and readable by search engines). Explains
 * the feature: known callers ring straight through to the owner's cell,
 * everyone else gets the AI.
 */
const VIP_EXAMPLES = [
  { initials: "M", label: "Mom", note: "Straight to your phone", tone: "bg-primary/10 text-primary" },
  { initials: "TC", label: "Top client", note: "Straight to your phone", tone: "bg-accent/15 text-accent-hover" },
  { initials: "P", label: "Partner", note: "Straight to your phone", tone: "bg-primary/10 text-primary" },
];

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
          <p className="mx-auto mt-3 max-w-lg text-balance text-muted-foreground">
            Run your business from your cell? Add the numbers that matter — family,
            top clients, your crew — and they ring <strong>straight through to
            you</strong>. New callers get your AI receptionist. Nobody important
            ever gets a bot.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl items-center gap-8 lg:grid-cols-2">
          {/* VIP list card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Your VIP list</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Star className="size-3.5 text-accent" />
                Always prioritized
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {VIP_EXAMPLES.map((v) => (
                <li
                  key={v.label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3"
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${v.tone}`}>
                    {v.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{v.label}</span>
                    <span className="block text-xs text-muted-foreground">{v.note}</span>
                  </span>
                  <span className="text-accent" aria-hidden="true">✓</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Add or remove VIPs anytime in your dashboard.
            </p>
          </div>

          {/* How it works flow */}
          <div>
            <h3 className="text-lg font-semibold">How it works</h3>
            <ol className="mt-5 space-y-4">
              <li className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <PhoneCall className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">A call comes in</p>
                  <p className="text-sm text-muted-foreground">
                    We instantly check the caller's number against your VIP list —
                    before anyone hears a greeting.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-hover">
                  <Star className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">A VIP? → Straight to your cell</p>
                  <p className="text-sm text-muted-foreground">
                    It rings your phone directly — like they always call you. No
                    AI, no menu, no waiting.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">Everyone else? → Your AI answers</p>
                  <p className="text-sm text-muted-foreground">
                    New callers get your AI receptionist, which answers, helps, and
                    captures the lead 24/7.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/pricing">
                  Start — $9.99 for 14 days
                  <ArrowRight />
                </Link>
              </Button>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-accent" />
                Use one number for business — keep your circle human.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
