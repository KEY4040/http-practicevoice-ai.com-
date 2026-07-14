import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useJsonLd, breadcrumbLd, faqLd } from "@/hooks/useJsonLd";
import { COMPARISONS } from "@/data/comparisons";

export default function Comparison({ slug }: { slug: string }) {
  const c = COMPARISONS[slug];
  useDocumentMeta({
    title: c.metaTitle,
    description: c.metaDescription,
    path: `/vs/${c.slug}`,
  });

  useJsonLd(`vs-${c.slug}`, [
    faqLd([
      { q: `How is PracticeVoice AI different from ${c.competitor}?`, a: c.sub },
      { q: `When is ${c.competitor} the better choice?`, a: c.fairness },
    ]),
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: `vs ${c.competitor}`, path: `/vs/${c.slug}` },
    ]),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="bg-grid">
          <div className="container-page py-16 text-center lg:py-20">
            <Badge variant="primary" className="mb-5">
              Comparison
            </Badge>
            <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              {c.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
              {c.sub}
            </p>
          </div>
        </section>

        {/* Table */}
        <section className="pb-6">
          <div className="container-page">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-border bg-muted/40 text-sm font-semibold">
                <div className="px-4 py-3.5 text-muted-foreground sm:px-6">Feature</div>
                <div className="px-3 py-3.5 text-primary sm:px-4">
                  PracticeVoice<span className="text-accent"> AI</span>
                </div>
                <div className="px-3 py-3.5 text-muted-foreground sm:px-4">{c.competitor}</div>
              </div>
              {c.rows.map((r) => (
                <div
                  key={r.label}
                  className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-border text-sm last:border-0"
                >
                  <div className="px-4 py-4 font-medium sm:px-6">{r.label}</div>
                  <div className="flex items-start gap-1.5 px-3 py-4 sm:px-4">
                    {r.pvWins && <Check className="mt-0.5 size-4 shrink-0 text-accent" />}
                    <span className={r.pvWins ? "font-semibold" : ""}>{r.pv}</span>
                  </div>
                  <div className="flex items-start gap-1.5 px-3 py-4 text-muted-foreground sm:px-4">
                    {!r.pvWins && <Minus className="mt-0.5 size-4 shrink-0 opacity-50" />}
                    <span>{r.them}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Fairness note — keeps it honest */}
            <p className="mx-auto mt-6 max-w-3xl rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Being fair:</span>{" "}
              {c.fairness}
            </p>

            {/* Internal links — how it works for each practice type */}
            <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-muted-foreground">
              See how PracticeVoice AI works for{" "}
              <Link to="/dental" className="font-medium text-primary hover:underline">
                dental practices
              </Link>
              ,{" "}
              <Link to="/medical" className="font-medium text-primary hover:underline">
                medical practices
              </Link>
              , and{" "}
              <Link to="/legal" className="font-medium text-primary hover:underline">
                law firms
              </Link>
              .
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 pt-8">
          <div className="container-page">
            <div className="rounded-[1.75rem] border border-border bg-muted/40 px-7 py-14 text-center sm:px-12">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                See it for yourself
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
                Explore the live dashboard, then start a 14-day trial for $9.99 —
                cancel anytime.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/demo">
                    See live dashboard
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
