import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Logo } from "@/components/marketing/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { PLANS, type Plan } from "@/data/plans";
import { startCheckout } from "@/lib/checkout";
import { cn } from "@/lib/utils";

/**
 * Where a signed-in user without an active plan lands. Starting a plan sends
 * them to Stripe checkout carrying their user id, so the stripe-webhook can
 * unlock their dashboard when the trial begins.
 */
export default function Billing() {
  useDocumentMeta({ title: "Choose your plan", noindex: true });
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { state } = useSubscription();
  const expired = state === "expired";

  function choose(plan: Plan) {
    // Carry the user id (client_reference_id) + email so the stripe-webhook can
    // reconcile the payment to this exact account and unlock the dashboard.
    startCheckout(plan, navigate, { userId: user?.id, email: user?.email });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
        <button
          onClick={() => signOut()}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            {expired ? "Your free trial has ended" : "Start your 14-day free trial"}
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {expired
              ? "Pick a plan to keep your receptionist running"
              : "One quick step to activate your receptionist"}
          </h1>
          <p className="mt-3 text-balance text-muted-foreground">
            {expired
              ? "Your calls, appointments, and data are safe — choose a plan to pick right back up. Cancel anytime."
              : "Pick a plan to start your free trial. You won't be charged until the trial ends, and you can cancel anytime."}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 shadow-card",
                plan.highlighted
                  ? "border-primary/40 ring-1 ring-primary/15"
                  : "border-border"
              )}
            >
              {plan.badge && (
                <Badge variant="primary" className="mb-3 w-fit">
                  {plan.badge}
                </Badge>
              )}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">
                  ${plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <Button
                className="mt-5 w-full"
                variant={plan.highlighted ? "primary" : "outline"}
                onClick={() => choose(plan)}
              >
                Start free trial
                <ArrowRight />
              </Button>
              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-md text-center text-xs text-muted-foreground">
          Signed in as {user?.email}. After you start a plan, this screen unlocks
          into your dashboard automatically.
        </p>
      </main>
    </div>
  );
}
