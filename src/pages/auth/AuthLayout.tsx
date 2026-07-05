import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Star, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/marketing/Logo";

/**
 * Two-column auth shell: form on the left, trust/marketing panel on the right
 * (hidden on mobile). Shared by Login and Signup.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>

      {/* Marketing / trust panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-[hsl(224_76%_30%)]" />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-accent/10" />
        <div className="relative flex h-full flex-col justify-center px-14 text-primary-foreground">
          <blockquote className="max-w-md text-2xl font-semibold leading-snug">
            “We booked 40 more appointments in our first month — from calls we
            used to miss entirely.”
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-white/15 font-semibold">
              DR
            </div>
            <div>
              <p className="font-medium">Dr. Renee Alvarez</p>
              <p className="text-sm text-primary-foreground/70">
                Bayview Dental Group
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            {[
              { Icon: CalendarCheck, text: "24/7 appointment booking" },
              { Icon: ShieldCheck, text: "HIPAA-conscious & encrypted" },
              { Icon: Star, text: "Rated 4.9/5 by 200+ practices" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="grid size-9 place-items-center rounded-lg bg-white/10">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
