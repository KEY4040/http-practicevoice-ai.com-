import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  price: number;
  tagline: string;
  cta: string;
  highlight?: boolean;
  features: string[];
}

const tiers: Tier[] = [
  {
    name: "Basic",
    price: 149,
    tagline: "For solo practices getting started with AI reception.",
    cta: "Start free trial",
    features: [
      "Up to 300 answered calls / mo",
      "24/7 appointment booking",
      "Google Calendar sync",
      "SMS confirmations",
      "Call transcripts & summaries",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: 349,
    tagline: "For growing practices that want full ROI visibility.",
    cta: "Start 14-day free trial",
    highlight: true,
    features: [
      "Up to 1,500 answered calls / mo",
      "Everything in Basic, plus:",
      "Revenue attribution dashboard",
      "Smart SMS reminders & recalls",
      "Multi-provider scheduling",
      "Urgent-call escalation routing",
      "Priority support",
    ],
  },
  {
    name: "Premium",
    price: 749,
    tagline: "For multi-location groups and specialty practices.",
    cta: "Talk to sales",
    features: [
      "Unlimited answered calls",
      "Everything in Professional, plus:",
      "Multi-location management",
      "Custom voice & knowledge base",
      "EHR / PMS integrations",
      "Dedicated success manager",
      "HIPAA BAA included",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-grid">
          <div className="container-page py-16 text-center lg:py-20">
            <Badge variant="primary" className="mb-4">
              <Sparkles className="size-3.5" />
              Simple, transparent pricing
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              Pricing that pays for itself
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
              One booked appointment usually covers the whole month. Start with a
              14-day free trial — no credit card required.
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="container-page">
            <div className="grid items-start gap-6 lg:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={cn(
                    "relative flex flex-col rounded-[1.5rem] border bg-card p-8 shadow-card",
                    tier.highlight
                      ? "border-primary/40 shadow-elevated lg:-mt-4 lg:pb-10 ring-1 ring-primary/20"
                      : "border-border"
                  )}
                >
                  {tier.highlight && (
                    <Badge
                      variant="primary"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-soft"
                    >
                      Most popular
                    </Badge>
                  )}

                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">
                    {tier.tagline}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>

                  <Button
                    asChild
                    className="mt-6"
                    variant={tier.highlight ? "primary" : "outline"}
                    size="lg"
                  >
                    <Link to={tier.name === "Premium" ? "/signup" : "/signup"}>
                      {tier.cta}
                      {tier.highlight && <ArrowRight />}
                    </Link>
                  </Button>

                  <ul className="mt-8 space-y-3.5">
                    {tier.features.map((f) => {
                      const isHeader = f.endsWith("plus:");
                      return (
                        <li
                          key={f}
                          className={cn(
                            "flex items-start gap-3 text-sm",
                            isHeader
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {!isHeader && (
                            <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                          )}
                          <span className={isHeader ? "pt-2" : ""}>{f}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-muted-foreground">
              All plans include unlimited team members, encrypted call storage,
              and a HIPAA-conscious infrastructure.{" "}
              <a href="mailto:hello@practicevoice-ai.com" className="font-medium text-primary hover:underline">
                Questions? Talk to us
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
