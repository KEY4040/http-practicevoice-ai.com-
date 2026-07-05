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
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? (
                    <Link
                      to={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} PracticeVoice AI. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              HIPAA
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
