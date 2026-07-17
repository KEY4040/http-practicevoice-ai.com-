import { createContext, useContext, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Marks a subtree as the PUBLIC demo view — the real dashboard pages rendered
 * with sample data, reachable without signing in (at /demo). Data hooks force
 * mock data when this is on, and links resolve to the /demo base path so a
 * visitor can explore without ever hitting the auth wall.
 */
interface DemoView {
  demo: boolean;
  /** Base path for dashboard links: "/demo" in the public demo, else "/dashboard". */
  base: string;
  /**
   * Which industry dataset to show, from ?industry= (e.g. "legal"). Lets a
   * legal buyer see legal call history + legal revenue instead of the dental
   * default. Undefined outside the demo (and falls back to dental inside it).
   */
  industry?: string;
  /**
   * Query suffix that carries the industry across demo-internal links
   * ("?industry=legal", or "" outside the demo / with no industry). Append it
   * to demo links so navigating dashboard → calls → detail keeps one story.
   */
  q: string;
}

const DemoViewContext = createContext<DemoView>({ demo: false, base: "/dashboard", q: "" });

export function DemoViewProvider({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const industry = params.get("industry") ?? undefined;
  const q = industry ? `?industry=${encodeURIComponent(industry)}` : "";
  return (
    <DemoViewContext.Provider value={{ demo: true, base: "/demo", industry, q }}>
      {children}
    </DemoViewContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemoView(): DemoView {
  return useContext(DemoViewContext);
}
