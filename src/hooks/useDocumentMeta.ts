import { useEffect } from "react";

const SITE = "https://practicevoice-ai.com";
const SUFFIX = "PracticeVoice AI";

interface Meta {
  title: string;
  description?: string;
  /** Path only, e.g. "/pricing". Defaults to the current pathname. */
  path?: string;
  /** Keep signed-in app pages out of the index. */
  noindex?: boolean;
}

function upsertMeta(selector: string, attr: string, key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

/**
 * Set per-route <title>, description, canonical, and robots. Vite serves a
 * single index.html for every route, so without this every page would report
 * the homepage's title/canonical to crawlers. Lightweight and dependency-free.
 */
export function useDocumentMeta({ title, description, path, noindex }: Meta) {
  useEffect(() => {
    const fullTitle = title.includes(SUFFIX) ? title : `${title} — ${SUFFIX}`;
    document.title = fullTitle;

    if (description) {
      upsertMeta('meta[name="description"]', "name", "description", description);
      upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    }
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);

    const canonicalPath = path ?? window.location.pathname;
    const href = `${SITE}${canonicalPath === "/" ? "/" : canonicalPath}`;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;
    upsertMeta('meta[property="og:url"]', "property", "og:url", href);

    upsertMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow"
    );
  }, [title, description, path, noindex]);
}
