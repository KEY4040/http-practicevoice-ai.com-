import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useJsonLd, breadcrumbLd } from "@/hooks/useJsonLd";
import { BLOG_POSTS } from "@/data/blog";

const SITE = "https://practicevoice-ai.com";

export default function Blog() {
  useDocumentMeta({
    title: "Blog — AI Receptionist Insights for Every Business",
    description:
      "Real numbers and plain-English guides on missed calls and AI receptionists for home services, auto, salons, restaurants, real estate, medical, dental, legal, and assistance lines.",
    path: "/blog",
  });

  useJsonLd("blog-index", [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "PracticeVoice AI Blog",
      url: `${SITE}/blog`,
      description:
        "Guides on missed calls and AI receptionists for home services, auto, salons, restaurants, real estate, medical, dental, legal, and community assistance lines.",
      blogPost: BLOG_POSTS.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.description,
        datePublished: p.isoDate,
        url: `${SITE}/blog/${p.slug}`,
      })),
    },
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]),
  ]);

  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <section className="bg-grid">
          <div className="container-page py-16 text-center lg:py-20">
            <Badge variant="primary" className="mb-4">
              Insights
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              The cost of a missed call — and how to fix it
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
              Real, cited numbers on missed calls and AI reception for every
              business that answers the phone.
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="container-page">
            {/* Featured */}
            <Link
              to={`/blog/${featured.slug}`}
              className="group block rounded-[1.5rem] border border-border bg-card p-8 shadow-card transition-shadow hover:shadow-elevated sm:p-10"
            >
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="neutral">{featured.tag}</Badge>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {featured.readTime}
                </span>
                <span>{featured.date}</span>
              </div>
              <h2 className="mt-4 text-balance text-2xl font-bold tracking-tight group-hover:text-primary sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                {featured.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Read the article
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Grid */}
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-7 shadow-card transition-shadow hover:shadow-elevated"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="neutral">{p.tag}</Badge>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {p.readTime}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug group-hover:text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Read more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-14 rounded-[1.75rem] border border-border bg-muted/40 px-7 py-12 text-center sm:px-12">
              <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                See what your missed calls are worth
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-balance text-muted-foreground">
                PracticeVoice AI answers every call 24/7, books the
                appointment, and shows you the revenue. Live the same day.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/pricing">
                    Start 14-day free trial
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
