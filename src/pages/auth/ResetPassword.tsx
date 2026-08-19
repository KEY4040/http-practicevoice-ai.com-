import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

/**
 * Landing page for the password-reset email link. Supabase establishes a
 * recovery session from the link, so updatePassword() sets the new password on
 * it. If someone opens this without a valid link, updateUser fails and we show a
 * clear "request a new link" message.
 */
export default function ResetPassword() {
  useDocumentMeta({ title: "Set a new password", noindex: true });
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      setError(
        err instanceof Error && /session|missing|expired|invalid/i.test(err.message)
          ? "This reset link is invalid or has expired. Request a new one."
          : err instanceof Error
            ? err.message
            : "Couldn't update your password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You're all set.">
        <div className="rounded-xl border border-accent/30 bg-accent/[0.05] p-5 text-sm text-muted-foreground">
          <Check className="mb-2 size-5 text-accent-hover" />
          Your password has been changed. Taking you to the log-in page…
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in now
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a new password for your account.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
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
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}{" "}
            {/expired|invalid/i.test(error) && (
              <Link to="/forgot-password" className="font-semibold underline">
                Request a new link
              </Link>
            )}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Update password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
