/**
 * Build-time prerender (runs AFTER `vite build`, non-fatal).
 *
 * A Vite SPA ships one empty index.html for every route, so crawlers that don't
 * run JavaScript (GPTBot, PerplexityBot, ClaudeBot, and search engines' first
 * pass) see the homepage's head on every URL and no body text. This script
 * writes a real static HTML file per marketing route — correct <title>,
 * description, canonical, OG, per-route JSON-LD, and readable body content —
 * pulled from the SAME data files the React app uses, so they never drift.
 *
 * SAFETY: the whole thing is wrapped in try/catch and ALWAYS exits 0. If
 * anything goes wrong it logs and leaves the normal SPA output untouched, so
 * this step can never fail the Netlify build or break the live site.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { VERTICALS } from "../src/data/verticals.ts";
import { COMPARISONS } from "../src/data/comparisons.ts";
import { PLANS } from "../src/data/plans.ts";
import { BLOG_POSTS } from "../src/data/blog.ts";

const SITE = "https://practicevoice-ai.com";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

// ---------- tiny helpers ----------
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const abs = (path: string) => `${SITE}${path === "/" ? "/" : path}`;

function breadcrumbLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

function faqLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Minimal, safe Markdown -> HTML for blog bodies (mirrors src/lib/markdown.tsx). */
function mdToHtml(md: string): string {
  const inline = (t: string) =>
    esc(t)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("### ")) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
    if (line.startsWith("## ")) { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
    if (line.startsWith("# ")) { out.push(`<h2>${inline(line.slice(2))}</h2>`); i++; continue; }
    if (line.startsWith("> ")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { q.push(lines[i].slice(2)); i++; }
      out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`);
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].replace(/^[-*] /, "")); i++; }
      out.push(`<ul>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, "")); i++; }
      out.push(`<ol>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ol>`);
      continue;
    }
    // table
    if (line.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|/.test(lines[i + 1])) {
      const parse = (r: string) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const header = parse(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(parse(lines[i])); i++; }
      out.push(
        `<table><thead><tr>${header.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
          `</tbody></table>`
      );
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !lines[i].startsWith("#") && !lines[i].startsWith("> ") &&
      !/^[-*] /.test(lines[i]) && !/^\d+\. /.test(lines[i]) && !lines[i].startsWith("|")
    ) { para.push(lines[i]); i++; }
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

// ---------- per-route definitions ----------
interface Route {
  path: string;
  title: string;
  description: string;
  jsonLd: unknown[];
  body: string;
}

function verticalRoute(slug: keyof typeof VERTICALS): Route {
  const v = VERTICALS[slug];
  return {
    path: `/${v.slug}`,
    title: v.metaTitle,
    description: v.metaDescription,
    jsonLd: [
      faqLd(v.faqs),
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `AI receptionist for ${v.audience}`,
        serviceType: "AI voice receptionist",
        provider: { "@type": "Organization", name: "PracticeVoice AI", url: `${SITE}/` },
        areaServed: { "@type": "Country", name: "United States" },
        url: abs(`/${v.slug}`),
        description: v.metaDescription,
      },
      breadcrumbLd([{ name: "Home", path: "/" }, { name: v.audience, path: `/${v.slug}` }]),
    ],
    body:
      `<h1>${esc(v.headline)}</h1><p>${esc(v.sub)}</p>` +
      v.benefits.map((b) => `<h2>${esc(b.title)}</h2><p>${esc(b.body)}</p>`).join("") +
      `<h2>Questions from ${esc(v.audience)}</h2>` +
      v.faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join(""),
  };
}

function comparisonRoute(slug: keyof typeof COMPARISONS): Route {
  const c = COMPARISONS[slug];
  return {
    path: `/vs/${c.slug}`,
    title: c.metaTitle,
    description: c.metaDescription,
    jsonLd: [
      faqLd([
        { q: `How is PracticeVoice AI different from ${c.competitor}?`, a: c.sub },
        { q: `When is ${c.competitor} the better choice?`, a: c.fairness },
      ]),
      breadcrumbLd([{ name: "Home", path: "/" }, { name: `vs ${c.competitor}`, path: `/vs/${c.slug}` }]),
    ],
    body:
      `<h1>${esc(c.headline)}</h1><p>${esc(c.sub)}</p>` +
      `<table><thead><tr><th>Feature</th><th>PracticeVoice AI</th><th>${esc(c.competitor)}</th></tr></thead><tbody>` +
      c.rows.map((r) => `<tr><td>${esc(r.label)}</td><td>${esc(r.pv)}</td><td>${esc(r.them)}</td></tr>`).join("") +
      `</tbody></table><p><strong>Being fair:</strong> ${esc(c.fairness)}</p>`,
  };
}

function blogPostRoute(slug: string): Route {
  const p = BLOG_POSTS.find((x) => x.slug === slug)!;
  return {
    path: `/blog/${p.slug}`,
    title: `${p.title} — PracticeVoice AI`,
    description: p.description,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: p.title,
        description: p.description,
        datePublished: p.isoDate,
        dateModified: p.isoDate,
        author: { "@type": "Organization", name: "PracticeVoice AI" },
        publisher: {
          "@type": "Organization",
          name: "PracticeVoice AI",
          logo: { "@type": "ImageObject", url: `${SITE}/apple-touch-icon.png` },
        },
        image: `${SITE}/og-image.png`,
        mainEntityOfPage: abs(`/blog/${p.slug}`),
        url: abs(`/blog/${p.slug}`),
      },
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: p.title, path: `/blog/${p.slug}` },
      ]),
    ],
    body: `<article><h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>${mdToHtml(p.body)}</article>`,
  };
}

function buildRoutes(): Route[] {
  const routes: Route[] = [];

  // Home — keep the homepage's own FAQ + a readable hero.
  routes.push({
    path: "/",
    title: "PracticeVoice AI — Never miss another customer call",
    description:
      "The AI voice receptionist for any business that answers the phone — home services, auto, salons, restaurants, real estate, medical, dental, legal, and assistance lines. Book jobs and appointments 24/7 and see the revenue your AI generates.",
    jsonLd: [
      faqLd([
        { q: "What is PracticeVoice AI?", a: "PracticeVoice AI is an AI voice receptionist for any business that answers the phone — home services, auto, salons, restaurants, real estate, medical, dental, legal, and community assistance lines. It answers every incoming call, books appointments and service calls around the clock, sends text confirmations, and shows the revenue each call generates." },
        { q: "How does the AI receptionist answer calls?", a: "You forward your existing business line to PracticeVoice AI. A warm, professional AI voice answers on the first ring, understands what the caller needs, books the right appointment or job, and texts a confirmation — day or night." },
        { q: "Is PracticeVoice AI HIPAA compliant?", a: "PracticeVoice AI is built for HIPAA-conscious workflows: data is encrypted in transit and at rest, access is restricted to your authorized team, and a Business Associate Agreement (BAA) is available on qualifying plans." },
        { q: "How long does setup take?", a: "Most businesses are live the same day: forward your number, set your hours and services, and your AI receptionist starts answering and booking calls right away." },
        { q: "How much does PracticeVoice AI cost?", a: "Plans start at $99/month, with Professional at $199/month and Premium at $399/month. Every plan includes a 14-day free trial, and you can cancel anytime." },
        { q: "Which businesses is it built for?", a: "Any business that can't afford to miss a call — home services and trades, auto shops, salons and spas, restaurants, real estate teams, medical, dental, and veterinary offices, law firms, and nonprofit or community assistance lines." },
      ]),
    ],
    body:
      `<h1>Never miss another customer call</h1>` +
      `<p>PracticeVoice AI is the AI voice receptionist for any business that answers the phone — home services, contractors, auto shops, salons, restaurants, real estate, medical, dental, veterinary, and legal practices, and community assistance lines. It answers every call 24/7, books appointments and jobs, sends text confirmations, and shows you the revenue it generates.</p>` +
      `<p>If your phone rings, PracticeVoice answers it. Live the same day. 14-day free trial.</p>`,
  });

  // Every vertical in the data file — new industries prerender automatically.
  for (const slug of Object.keys(VERTICALS) as (keyof typeof VERTICALS)[]) {
    routes.push(verticalRoute(slug));
  }

  routes.push(comparisonRoute("ruby"));
  routes.push(comparisonRoute("answering-service"));
  routes.push(comparisonRoute("smith-ai"));

  // Pricing
  routes.push({
    path: "/pricing",
    title: "Pricing — PracticeVoice AI",
    description:
      "Straightforward pricing for PracticeVoice AI. Plans from $99/mo with a 14-day free trial.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "PracticeVoice AI",
        description: "AI voice receptionist for any business that answers the phone.",
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
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]),
    ],
    body:
      `<h1>One booked job covers the month</h1><p>Pick a plan and go live the same day. 14-day free trial, cancel anytime.</p>` +
      PLANS.map(
        (p) =>
          `<h2>${esc(p.name)} — $${p.price}/month</h2><p>${esc(p.tagline)}</p><ul>${p.features
            .map((f) => `<li>${esc(f)}</li>`)
            .join("")}</ul>`
      ).join(""),
  });

  // Blog index
  routes.push({
    path: "/blog",
    title: "Blog — AI Receptionist Insights for Every Business",
    description:
      "Real numbers and plain-English guides on missed calls and AI receptionists for home services, auto, salons, restaurants, real estate, medical, dental, legal, and assistance lines.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "PracticeVoice AI Blog",
        url: `${SITE}/blog`,
        blogPost: BLOG_POSTS.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          description: p.description,
          datePublished: p.isoDate,
          url: abs(`/blog/${p.slug}`),
        })),
      },
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]),
    ],
    body:
      `<h1>The cost of a missed call — and how to fix it</h1>` +
      BLOG_POSTS.map(
        (p) =>
          `<article><h2><a href="/blog/${p.slug}">${esc(p.title)}</a></h2><p>${esc(p.description)}</p></article>`
      ).join(""),
  });

  // Blog posts
  for (const p of BLOG_POSTS) routes.push(blogPostRoute(p.slug));

  // Contact — otherwise a no-JS crawler gets the homepage head on /contact.
  routes.push({
    path: "/contact",
    title: "Book a Demo — PracticeVoice AI",
    description:
      "See PracticeVoice AI answer a live call. Book a 15-minute demo and watch it book an appointment and log the revenue in real time.",
    jsonLd: [
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Book a demo", path: "/contact" }]),
    ],
    body: `<h1>Book a demo</h1><p>See PracticeVoice AI answer a call, book the appointment, and log the revenue — live. Tell us about your business and pick a time.</p>`,
  });

  // Legal pages — prerender so they aren't served the homepage head.
  for (const [path, title, description] of [
    ["/privacy", "Privacy Policy — PracticeVoice AI", "How PracticeVoice AI collects, uses, and protects data."],
    ["/terms", "Terms of Service — PracticeVoice AI", "The terms governing use of PracticeVoice AI."],
    ["/hipaa", "HIPAA & Security — PracticeVoice AI", "PracticeVoice AI's HIPAA-conscious posture: encryption, access control, audit logging, and BAA availability."],
  ] as const) {
    const name = title.split(" — ")[0];
    routes.push({
      path,
      title,
      description,
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name, path }])],
      body: `<h1>${esc(name)}</h1><p>${esc(description)}</p>`,
    });
  }

  return routes;
}

// ---------- HTML assembly ----------
function renderPage(shell: string, route: Route): string {
  let html = shell;

  // 1. Strip the homepage FAQPage from the shared shell for non-home routes so
  //    it doesn't collide with the route's own FAQ. Keep Organization/WebSite/
  //    SoftwareApplication (sitewide-correct).
  html = html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    (m, json) => {
      try {
        const arr = JSON.parse(json.trim());
        if (Array.isArray(arr)) {
          const kept =
            route.path === "/"
              ? arr
              : arr.filter((n: { ["@type"]?: string }) => n["@type"] !== "FAQPage");
          return `<script type="application/ld+json">${JSON.stringify(kept)}</script>`;
        }
      } catch {
        /* leave as-is */
      }
      return m;
    }
  );

  // 2. Per-route head tags.
  const t = esc(route.title);
  const d = esc(route.description);
  const url = abs(route.path);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${d}" />`
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${url}" />`
  );
  html = html.replace(
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${t}" />`
  );
  html = html.replace(
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${d}" />`
  );
  html = html.replace(
    /<meta property="og:url"[^>]*>/,
    `<meta property="og:url" content="${url}" />`
  );
  // Twitter card — otherwise every static page ships the homepage's card.
  html = html.replace(
    /<meta name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${t}" />`
  );
  html = html.replace(
    /<meta name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${d}" />`
  );

  // 3. Inject per-route JSON-LD before </head>.
  const ld = route.jsonLd
    .map((n) => `<script type="application/ld+json">${JSON.stringify(n)}</script>`)
    .join("");
  html = html.replace("</head>", `${ld}</head>`);

  // 4. Inject readable body into #root (React replaces it on hydrate, crawlers read it).
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><div class="prerender">${route.body}</div></div>`
  );

  return html;
}

async function main() {
  const shellPath = join(DIST, "index.html");
  if (!existsSync(shellPath)) {
    console.log("[prerender] dist/index.html not found — skipping (SPA unaffected).");
    return;
  }
  const shell = await readFile(shellPath, "utf8");
  const routes = buildRoutes();
  let ok = 0;
  for (const route of routes) {
    try {
      const html = renderPage(shell, route);
      const outDir = route.path === "/" ? DIST : join(DIST, route.path);
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, "index.html"), html, "utf8");
      ok++;
    } catch (e) {
      console.log(`[prerender] skip ${route.path}: ${(e as Error).message}`);
    }
  }
  console.log(`[prerender] wrote ${ok}/${routes.length} static pages.`);

  // Generate sitemap.xml from the SAME data, so new pages are never forgotten.
  try {
    await writeSitemap();
    console.log("[prerender] wrote sitemap.xml");
  } catch (e) {
    console.log(`[prerender] sitemap skip: ${(e as Error).message}`);
  }
}

/** Build sitemap.xml from the data files (replaces the hand-kept static one). */
async function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const url = (path: string, priority: string, changefreq: string, lastmod = today) =>
    `  <url>\n    <loc>${abs(path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

  const urls: string[] = [
    url("/", "1.0", "weekly"),
    url("/pricing", "0.9", "weekly"),
    ...Object.values(VERTICALS).map((v) => url(`/${v.slug}`, "0.8", "monthly")),
    ...Object.values(COMPARISONS).map((c) => url(`/vs/${c.slug}`, "0.7", "monthly")),
    url("/blog", "0.7", "weekly"),
    ...BLOG_POSTS.map((p) => url(`/blog/${p.slug}`, "0.6", "monthly", p.isoDate)),
    url("/contact", "0.6", "monthly"),
    url("/privacy", "0.3", "yearly"),
    url("/terms", "0.3", "yearly"),
    url("/hipaa", "0.3", "yearly"),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  await writeFile(join(DIST, "sitemap.xml"), xml, "utf8");
}

main().catch((e) => {
  // NEVER fail the build.
  console.log(`[prerender] non-fatal error, leaving SPA as-is: ${(e as Error).message}`);
  process.exit(0);
});
