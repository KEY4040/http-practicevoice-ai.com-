import { Link } from "react-router-dom";
import { ArrowRight, Check, PhoneCall, ShieldCheck, Clock } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useJsonLd, breadcrumbLd, faqLd } from "@/hooks/useJsonLd";
import { VERTICALS, type Vertical as VerticalData } from "@/data/verticals";
import { BLOG_POSTS } from "@/data/blog";

const SITE = "https://practicevoice-ai.com";

// Hub-and-spoke: each vertical links down to its most relevant articles.
const RELATED_POSTS: Record<VerticalData["slug"], string[]> = {
  dental: ["cost-of-missed-calls-dental-practice", "ai-receptionist-vs-answering-service"],
  medical: ["real-cost-of-missed-calls-medical-practices", "hipaa-ai-receptionist-guide"],
  legal: ["ai-reception-for-law-firms-never-miss-a-call", "ai-receptionist-vs-answering-service"],
};

export default function Vertical({ slug }: { slug: VerticalData["slug"] }) {
  const v = VERTICALS[slug];
  useDocumentMeta({
    title: v.metaTitle,
    description: v.metaDescription,
    path: `/${v.slug}`,
  });

  useJsonLd(`vertical-${v.slug}`, [
    faqLd(v.faqs),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `AI receptionist for ${v.audience}`,
      serviceType: "AI voice receptionist",
      provider: { "@type": "Organization", name: "PracticeVoice AI", url: `${SITE}/` },
      areaServed: { "@type": "Country", name: "United States" },
      url: `${SITE}/${v.slug}`,
      description: v.metaDescription,
    },
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: v.audience, path: `/${v.slug}` },
    ]),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="bg-grid">
          <div className="container-page py-16 text-center lg:py-24">
            <Badge variant="primary" className="mb-5">
              {v.eyebrow}
            </Badge>
            <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              {v.headline}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              {v.sub}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/pricing">
                  Start 14-day free trial
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/demo">See live dashboard</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-accent" />
                Live the same day
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-accent" />
                HIPAA-conscious &amp; secure
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PhoneCall className="size-4 text-accent" />
                Answers 24/7
              </span>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 lg:py-24">
          <div className="container-page">
            <div className="grid gap-6 md:grid-cols-3">
              {v.benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border border-border bg-card p-7 shadow-card"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Check className="size-5" />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold">{b.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-8">
          <div className="container-page">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
                Questions from {v.audience}
              </h2>
              <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
                {v.faqs.map((f) => (
                  <details key={f.q} className="group px-6 py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <h3 className="text-base font-semibold">{f.q}</h3>
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Further reading — internal links to blog */}
        <section className="pb-4 pt-12">
          <div className="container-page">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center text-2xl font-bold tracking-tight">
                Further reading
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {RELATED_POSTS[slug]
                  .map((s) => BLOG_POSTS.find((p) => p.slug === s))
                  .filter((p): p is (typeof BLOG_POSTS)[number] => Boolean(p))
                  .map((p) => (
                    <Link
                      key={p.slug}
                      to={`/blog/${p.slug}`}
                      className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
                    >
                      <h3 className="text-base font-semibold leading-snug group-hover:text-primary">
                        {p.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 pt-8">
          <div className="container-page">
            <div className="rounded-[1.75rem] border border-border bg-muted/40 px-7 py-14 text-center sm:px-12">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Stop losing {v.audience.split(" ")[0]} calls to voicemail
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
                14-day free trial, live the same day, cancel anytime.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/pricing">
                    Start free trial
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/demo">See the demo</Link>
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
