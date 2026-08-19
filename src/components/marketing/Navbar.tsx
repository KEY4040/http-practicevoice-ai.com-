import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const links = [
  { label: "Product", href: "/#product" },
  { label: "How it works", href: "/#how" },
  { label: "Demo", href: "/demo" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

/**
 * Render a nav item as a client-side <Link> for real routes, or a plain <a> for
 * same-page hash anchors (#product / #how) which need native scroll behavior.
 */
function NavItem({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className: string;
  onClick?: () => void;
}) {
  if (href.startsWith("/#")) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={href} onClick={onClick} className={className}>
      {label}
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape, for keyboard/accessibility parity.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavItem
              key={l.label}
              href={l.href}
              label={l.label}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            />
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/pricing">Start for $9.99</Link>
          </Button>
        </div>

        <button
          className="grid size-10 place-items-center rounded-lg text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu — collapsed to 0fr and `invisible` when closed, which also
          removes its links from the tab order. Closes on Escape (see effect). */}
      <div
        id="mobile-menu"
        className={cn(
          "grid overflow-hidden border-t border-border transition-all duration-300 lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-transparent"
        )}
      >
        <div className={cn("min-h-0", !open && "invisible")}>
          <div className="container-page flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavItem
                key={l.label}
                href={l.href}
                label={l.label}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              />
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link to="/login" onClick={() => setOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button asChild>
                <Link to="/pricing" onClick={() => setOpen(false)}>
                  Start for $9.99
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { NavLink };
