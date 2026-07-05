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

const perks = [
  "14-day free trial",
  "No credit card required",
  "Live in under 5 minutes",
];

export default function Signup() {
  useDocumentMeta({ title: "Start your free trial", noindex: true });
  const { signUp, demoMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // The plan chosen on the pricing/home page rides along in `?plan=`. When
  // Stripe is connected, this is where you'd start the Checkout Session after
  // the account is created.
  const selectedPlan = PLANS.find((p) => p.id === searchParams.get("plan"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password, name);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Start your free trial"
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
              ${selectedPlan.price}{selectedPlan.period} after your free trial
            </p>
          </div>
          <Badge variant="primary">14-day free trial</Badge>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Dr. Jane Smith"
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
            placeholder="you@yourpractice.com"
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
