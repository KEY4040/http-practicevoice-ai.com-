import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { PLANS } from "@/data/plans";
import { checkoutUrl } from "@/lib/checkout";
import { isBillingEnabled } from "@/lib/supabase";

const perks = [
  "$9.99 to start, then your plan",
  "Cancel anytime",
  "Set up in minutes",
];

export default function Signup() {
  useDocumentMeta({ title: "Start for $9.99", noindex: true });
  const { signUp, demoMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // The plan chosen on the pricing/home page rides along in `?plan=`; once the
  // account is created we continue straight to that plan's checkout (see onSubmit).
  const selectedPlan = PLANS.find((p) => p.id === searchParams.get("plan"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { needsConfirmation, userId } = await signUp(email, password, name);
      if (needsConfirmation) {
        // Email confirmation is on — don't pretend they're logged in. They'll
        // confirm, log in, and can start their plan from Billing.
        setConfirmSent(true);
        return;
      }
      // Account is live. If they picked a plan, continue to checkout NOW,
      // carrying their identity so the payment reconciles to this account
      // (never an orphaned payment). Demo mode has no real Stripe, so it just
      // lands in the app.
      if (selectedPlan && !demoMode) {
        if (isBillingEnabled) {
          navigate("/billing");
          return;
        }
        const url = checkoutUrl(selectedPlan, { userId, email });
        if (url) {
          window.location.href = url;
          return;
        }
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="One quick step to activate your account."
      >
        <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-foreground">{email}</span>. Click
          it to activate your account, then come back and log in.
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already confirmed?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Start for $9.99"
      subtitle="Get your AI receptionist answering calls today."
    >
      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
        {perks.map((p) => (
          <span key={p} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Check className="size-3.5 text-accent" />
            {p}
          </span>
        ))}
      </div>

      {selectedPlan && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{selectedPlan.name} plan</p>
            <p className="text-xs text-muted-foreground">
              ${selectedPlan.price}{selectedPlan.period} after your 14-day trial
            </p>
          </div>
          <Badge variant="primary">$9.99 for 14 days</Badge>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@yourbusiness.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>

      {demoMode && (
        <p className="mt-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <strong className="font-semibold text-foreground">Demo mode:</strong>{" "}
          Supabase isn't connected yet — sign-up creates a local demo session so
          you can explore the full product.
        </p>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Want to cancel a subscription?{" "}
        <Link to="/login" className="font-semibold text-destructive hover:underline">
          Log in to cancel
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link to="/terms" className="font-medium text-primary hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="font-medium text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
