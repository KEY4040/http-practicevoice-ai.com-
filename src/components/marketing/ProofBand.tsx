import { Link } from "react-router-dom";
import { PlayCircle, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Honest trust section for a brand-new product with no customers yet. Instead of
 * fabricated testimonials, it gives the visitor proof they control (see it live),
 * risk reversal (free trial, cancel anytime), and a real reason to act now
 * (founding-customer pricing). Every claim here is true today. Swap this for the
 * <Testimonials /> section once real customer quotes exist.
 */
const CARDS = [
  {
    Icon: PlayCircle,
    title: "See it work first",
    body: "Watch the AI answer a call and book a job in a live demo — no signup, no card.",
    cta: "Watch the live demo",
    to: "/demo",
  },
  {
    Icon: ShieldCheck,
    title: "Zero risk to try",
    body: "$9.99 to start, a full 14-day trial, and cancel anytime. No contract, ever.",
    cta: "Start for $9.99",
    to: "/signup",
    highlighted: true,
  },
  {
    Icon: Sparkles,
    title: "Founding customer",
    body: "Be one of our first businesses and lock in founder pricing for good.",
    cta: "Claim founder pricing",
    to: "/pricing",
  },
];

export function ProofBand() {
  return (
    <section className="py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            <ShieldCheck className="size-3.5" />
            Try it with zero risk
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Don&rsquo;t take our word for it — see it for yourself
          </h2>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            Watch it answer a real call, then try it free. Only keep it if it
            earns its keep.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {CARDS.map(({ Icon, title, body, cta, to, highlighted }) => (
            <div
              key={title}
              className={
                "flex flex-col rounded-2xl border bg-card p-7 shadow-card" +
                (highlighted
                  ? " border-primary/40 ring-1 ring-primary/20"
                  : " border-border")
              }
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{body}</p>
              <Link
                to={to}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
