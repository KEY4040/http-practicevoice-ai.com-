import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PhoneCall,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  LifeBuoy,
} from "lucide-react";
import { Logo } from "@/components/marketing/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDemoView } from "@/context/DemoView";
import { useSubscription, type AccessState } from "@/hooks/useSubscription";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NavEntry {
  label: string;
  to: string;
  Icon: typeof LayoutDashboard;
  end: boolean;
}

function navFor(base: string, demo: boolean): NavEntry[] {
  const items: NavEntry[] = [
    { label: "Dashboard", to: base, Icon: LayoutDashboard, end: true },
    { label: "Call History", to: `${base}/calls`, Icon: PhoneCall, end: false },
  ];
  // Settings needs a real account — hide it in the public demo.
  if (!demo) {
    items.push({ label: "Settings", to: `${base}/settings`, Icon: Settings, end: false });
  }
  return items;
}

function NavItems({ items, onNavigate }: { items: NavEntry[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ label, to, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Icon className="size-[18px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarInner({
  onNavigate,
  accessState = "open",
  trialDaysLeft = 0,
}: {
  onNavigate?: () => void;
  accessState?: AccessState;
  trialDaysLeft?: number;
}) {
  const { user, signOut } = useAuth();
  const { demo, base } = useDemoView();
  const items = navFor(base, demo);

  const card = demo
    ? {
        title: "This is a live demo",
        body: "Sample data. Start your own account for $9.99 to see your real calls here.",
        cta: "Start for $9.99",
        to: "/signup",
      }
    : accessState === "trial"
      ? {
          title: `Trial · ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`,
          body: "Choose a plan before it ends to keep your receptionist running.",
          cta: "Choose a plan",
          to: "/billing",
        }
      : accessState === "active"
        ? {
            title: "Plan active",
            body: "Thanks for being a customer. Manage or change your plan anytime.",
            cta: "Manage plan",
            to: "/pricing",
          }
        : {
            title: "Free beta",
            body: "You're on the free beta. Explore everything — no charge.",
            cta: "See plans",
            to: "/pricing",
          };

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <Logo />
      </div>

      <NavItems items={items} onNavigate={onNavigate} />

      {/* Call-to-action card */}
      <div className="mt-2 rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <span className="text-sm font-semibold">{card.title}</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{card.body}</p>
        <Button asChild size="sm" className="mt-3 w-full">
          <Link to={card.to} onClick={onNavigate}>
            {card.cta}
          </Link>
        </Button>
      </div>

      <div className="mt-auto space-y-1">
        <a
          href="mailto:practicevoiceai@yahoo.com"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LifeBuoy className="size-[18px]" />
          Support
        </a>

        {demo ? (
          <Link
            to="/"
            onClick={onNavigate}
            className="flex items-center justify-center rounded-xl border border-border p-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ← Back to site
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border p-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user ? initials(user.name) : "PV"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name ?? "Guest"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { demo, base } = useDemoView();
  const access = useSubscription();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const items = navFor(base, demo);
  const title =
    items.find((n) =>
      n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
    )?.label ?? "Dashboard";

  // Drawer accessibility: close on Escape, move focus into the drawer on open,
  // and restore focus to the trigger on close.
  useEffect(() => {
    if (!mobileOpen) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[272px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-card lg:block">
        <SidebarInner accessState={access.state} trialDaysLeft={access.trialDaysLeft} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          ref={menuButtonRef}
          onClick={() => setMobileOpen(true)}
          className="grid size-10 place-items-center rounded-lg text-foreground"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-drawer"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-fade-in bg-card shadow-elevated">
            <button
              ref={closeButtonRef}
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarInner
              onNavigate={() => setMobileOpen(false)}
              accessState={access.state}
              trialDaysLeft={access.trialDaysLeft}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-col">
        {/* Public demo banner */}
        {demo && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-primary px-4 py-2.5 text-center text-sm text-primary-foreground">
            <span className="font-medium">
              👋 You're exploring a live demo with sample data.
            </span>
            <Link
              to="/signup"
              className="font-semibold underline underline-offset-2 hover:no-underline"
            >
              Start for $9.99 →
            </Link>
          </div>
        )}

        {/* Free-trial countdown (reverse trial, when billing is enforced) */}
        {!demo && access.state === "trial" && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border bg-accent/10 px-4 py-2.5 text-center text-sm">
            <span className="font-medium text-foreground">
              🎁 {access.trialDaysLeft} day{access.trialDaysLeft === 1 ? "" : "s"} left in your free
              trial
            </span>
            <Link
              to="/billing"
              className="font-semibold text-accent-hover underline underline-offset-2 hover:no-underline"
            >
              Choose a plan →
            </Link>
          </div>
        )}
        <div className="hidden items-center justify-between border-b border-border bg-card/60 px-8 py-4 backdrop-blur lg:flex">
          <p className="text-lg font-semibold tracking-tight">{title}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-accent" />
            AI receptionist active
          </div>
        </div>
        <main id="main" className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
