import { useState } from "react";
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
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", to: "/dashboard", Icon: LayoutDashboard, end: true },
  { label: "Call History", to: "/dashboard/calls", Icon: PhoneCall, end: false },
  { label: "Settings", to: "/dashboard/settings", Icon: Settings, end: false },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ label, to, Icon, end }) => (
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

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <Logo />
      </div>

      <NavItems onNavigate={onNavigate} />

      {/* Upgrade card */}
      <div className="mt-2 rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <span className="text-sm font-semibold">Professional trial</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          9 days left. Unlock revenue attribution &amp; smart reminders.
        </p>
        <Button asChild size="sm" className="mt-3 w-full">
          <Link to="/pricing" onClick={onNavigate}>
            Upgrade plan
          </Link>
        </Button>
      </div>

      <div className="mt-auto space-y-1">
        <a
          href="mailto:hello@practicevoice-ai.com"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LifeBuoy className="size-[18px]" />
          Support
        </a>

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
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title =
    nav.find((n) =>
      n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
    )?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[272px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-card lg:block">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="grid size-10 place-items-center rounded-lg text-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-fade-in bg-card shadow-elevated">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarInner onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-col">
        <div className="hidden items-center justify-between border-b border-border bg-card/60 px-8 py-4 backdrop-blur lg:flex">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-accent" />
            AI receptionist active
          </div>
        </div>
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
