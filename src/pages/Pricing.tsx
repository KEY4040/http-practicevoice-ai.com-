import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useJsonLd, breadcrumbLd } from "@/hooks/useJsonLd";
import { PLANS, type Plan } from "@/data/plans";

const SITE = "https://practicevoice-ai.com";
import { checkoutUrl } from "@/lib/checkout";
import { isBillingEnabled } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function Pricing() {
  const { user } = useAuth();
  useDocumentMeta({
    title: "Pricing — PracticeVoice AI",
    description:
      "Straightforward pricing for PracticeVoice AI. Plans from $99/mo with a $9.99 trial.",
    path: "/pricing",
  });

  useJsonLd("pricing", [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "PracticeVoice AI",
      description:
        "AI voice receptionist for any business that answers the phone.",
      brand: { "@type": "Brand", name: "PracticeVoice AI" },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "99",
        highPrice: "399",
        offerCount: PLANS.length,
        offers: PLANS.map((p) => ({
          "@type": "Offer",
          name: p.name,
          price: String(p.price),
          priceCurrency: "USD",
          url: `${SITE}/pricing`,
          availability: "https://schema.org/InStock",
        })),
      },
    },
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Pricing", path: "/pricing" },
    ]),
  ]);

  // Where each plan's CTA points — returned as a real href so the button is a
  // genuine anchor (crawlable, middle-clickable, open-in-new-tab). Billing-
  // enforced accounts go to Billing/Signup; open beta goes straight to the
  // plan's Stripe link (with the signed-in identity when known).
  function ctaHref(plan: Plan): string {
    if (isBillingEnabled) return user ? "/billing" : `/signup?plan=${plan.id}`;
    return (
      checkoutUrl(plan, { userId: user?.id, email: user?.email }) ||
      `/signup?plan=${plan.id}`
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <section className="bg-grid">
          <div className="container-page py-16 text-center lg:py-20">
            <Badge variant="primary" className="mb-4">
              <Sparkles className="size-3.5" />
              Pays for itself
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              One booked job covers the month
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
              Pick a plan and go live the same day. $9.99 to start, then your
              plan, cancel anytime.
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="container-page">
            <div className="grid items-start gap-6 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-[1.5rem] border bg-card p-8 shadow-card",
                    plan.highlighted
                      ? "border-primary/40 shadow-elevated ring-1 ring-primary/20 lg:-mt-4 lg:pb-10"
                      : "border-border"
                  )}
                >
                  {plan.badge && (
                    <Badge
                      variant="primary"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-soft"
                    >
                      {plan.badge}
                    </Badge>
                  )}

                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{plan.name}</h2>
                    {plan.highlighted && (
                      <Badge variant="success">Best value</Badge>
                    )}
                  </div>
                  <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>

                  {/* Real anchor (asChild) — a genuine link, not a JS-only
                      button, so it's crawlable / middle-clickable. Full-width;
                      wraps to two lines on narrow phones, single line at sm+. */}
                  <Button
                    asChild
                    className="mt-6 h-auto w-full whitespace-normal py-3 leading-tight sm:h-12 sm:whitespace-nowrap sm:py-0"
                    variant={plan.highlighted ? "primary" : "outline"}
                    size="lg"
                    data-plan={plan.id}
                  >
                    {/^https?:/.test(ctaHref(plan)) ? (
                      <a href={ctaHref(plan)}>
                        {plan.cta}
                        {plan.highlighted && <ArrowRight />}
                      </a>
                    ) : (
                      <Link to={ctaHref(plan)}>
                        {plan.cta}
                        {plan.highlighted && <ArrowRight />}
                      </Link>
                    )}
                  </Button>

                  <ul className="mt-8 space-y-3.5">
                    {plan.features.map((f) => {
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
              Every plan includes unlimited team members, encrypted call storage,
              and HIPAA-ready infrastructure.{" "}
              <Link
                to="/contact"
                className="font-medium text-primary hover:underline"
              >
                Have a question? Book a demo
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
