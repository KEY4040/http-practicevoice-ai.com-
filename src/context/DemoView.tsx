import { createContext, useContext, type ReactNode } from "react";

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
}

const DemoViewContext = createContext<DemoView>({ demo: false, base: "/dashboard" });

export function DemoViewProvider({ children }: { children: ReactNode }) {
  return (
    <DemoViewContext.Provider value={{ demo: true, base: "/demo" }}>
      {children}
    </DemoViewContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemoView(): DemoView {
  return useContext(DemoViewContext);
}
