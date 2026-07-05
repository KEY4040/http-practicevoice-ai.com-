import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset scroll position on route change (ignores in-page hash links). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
