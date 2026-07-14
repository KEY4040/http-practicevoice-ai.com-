import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/lib/markdown";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useJsonLd, breadcrumbLd } from "@/hooks/useJsonLd";
import { BLOG_POSTS, getPost } from "@/data/blog";

const SITE = "https://practicevoice-ai.com";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  useDocumentMeta({
    title: post ? `${post.title} — PracticeVoice AI` : "Article — PracticeVoice AI",
    description: post?.description,
    path: post ? `/blog/${post.slug}` : "/blog",
    noindex: !post,
  });

  useJsonLd(
    "blog-post",
    post
      ? [
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.isoDate,
            dateModified: post.isoDate,
            author: { "@type": "Organization", name: "PracticeVoice AI" },
            publisher: {
              "@type": "Organization",
              name: "PracticeVoice AI",
              logo: {
                "@type": "ImageObject",
                url: `${SITE}/apple-touch-icon.png`,
              },
            },
            image: `${SITE}/og-image.png`,
            mainEntityOfPage: `${SITE}/blog/${post.slug}`,
            url: `${SITE}/blog/${post.slug}`,
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]
      : null
  );

  if (!post) return <Navigate to="/blog" replace />;

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <article className="container-page max-w-3xl py-14 lg:py-20">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            All articles
          </Link>

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="primary">{post.tag}</Badge>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {post.readTime}
              </span>
              <span>{post.date}</span>
            </div>
            <h1 className="mt-4 text-balance text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
          </header>

          <div className="mt-8 border-t border-border pt-2 text-[1.02rem]">
            <Markdown content={post.body} />
          </div>

          {/* Inline CTA */}
          <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 text-center">
            <h2 className="text-xl font-bold tracking-tight">
              Never miss another customer call
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              PracticeVoice AI answers 24/7, books the appointment, and shows the
              revenue it recovers. Live the same day.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/pricing">
                  Start — $9.99 for 14 days
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/demo">See the demo</Link>
              </Button>
            </div>
          </div>
        </article>

        {/* Related */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container-page max-w-5xl">
            <h2 className="text-xl font-bold tracking-tight">Keep reading</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
                >
                  <Badge variant="neutral" className="self-start">
                    {p.tag}
                  </Badge>
                  <h3 className="mt-3 text-base font-semibold leading-snug group-hover:text-primary">
                    {p.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Read
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
