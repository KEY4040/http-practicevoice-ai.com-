import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Practices",
    links: [
      { label: "Dental", href: "/#product" },
      { label: "Medical", href: "/#product" },
      { label: "Legal", href: "/#product" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Start free trial", href: "/signup" },
      { label: "Contact", href: "mailto:hello@practicevoice-ai.com" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground">
            The AI voice receptionist built for medical, dental, and legal
            practices. Never miss another call.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => {
                // Plain in-app routes use <Link>; hash targets (/#how) and
                // external/mailto links must be native <a> so the browser
                // actually scrolls / navigates (React Router won't scroll to a
                // hash on its own).
                const isRoute = l.href.startsWith("/") && !l.href.includes("#");
                const className =
                  "inline-block py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground";
                return (
                  <li key={l.label}>
                    {isRoute ? (
                      <Link to={l.href} className={className}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className={className}>
                        {l.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} PracticeVoice AI. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link to="/hipaa" className="hover:text-foreground">
              HIPAA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
