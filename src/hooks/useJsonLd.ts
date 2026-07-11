import { useEffect } from "react";

/**
 * Inject one or more JSON-LD structured-data blocks into <head> for the current
 * route, and clean them up on unmount. Vite serves a single index.html, so the
 * static FAQPage/Organization schema only describes the homepage — this lets
 * each route add its own schema (FAQPage, Product/AggregateOffer, BlogPosting,
 * BreadcrumbList) that Googlebot picks up on its JS render pass.
 *
 * Pass a stable `id` per page so re-renders replace rather than duplicate.
 */
export function useJsonLd(id: string, data: unknown | unknown[] | null) {
  useEffect(() => {
    if (!data) return;
    const elId = `ld-${id}`;
    let el = document.getElementById(elId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = elId;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => {
      document.getElementById(elId)?.remove();
    };
  }, [id, data]);
}

const SITE = "https://practicevoice-ai.com";

/** Home -> ... -> current. Pass [{name, path}], last item is the current page. */
export function breadcrumbLd(
  crumbs: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.path === "/" ? "/" : c.path}`,
    })),
  };
}

/** Build a FAQPage node from simple Q/A pairs. */
export function faqLd(
  faqs: { q: string; a: string }[]
): Record<string, unknown> {
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
