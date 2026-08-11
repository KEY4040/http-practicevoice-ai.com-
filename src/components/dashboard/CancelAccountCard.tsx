import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cancelAccount } from "@/lib/cancelAccount";

/**
 * "Danger zone" — cancel the subscription and permanently delete the account.
 * Two-step so it can't be triggered by accident: the button reveals a red
 * warning, and only the explicit confirm actually cancels + deletes. On success
 * the user is signed out and sent to sign-up (they'd re-register to return).
 */
export function CancelAccountCard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmCancel() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await cancelAccount();
    if (r.status === "ok") {
      // Account is gone — clear the session and send them to sign-up.
      try {
        await signOut();
      } catch {
        /* ignore — the account is already deleted server-side */
      }
      navigate("/signup", { replace: true });
      return;
    }
    setBusy(false);
    setError(
      r.message ||
        (r.status === "not_configured"
          ? "Cancellation isn't switched on yet — contact support."
          : "Couldn't cancel just now — please try again.")
    );
  }

  return (
    <Card className="border-destructive/30 bg-destructive/[0.03] p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Cancel subscription</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cancels your plan and permanently deletes your account — your AI line,
            settings, calls, and appointments. This can&rsquo;t be undone, and
            you&rsquo;d need to register again to use PracticeVoice AI.
          </p>

          {!confirming ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              Cancel subscription
            </Button>
          ) : (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/[0.06] p-4">
              <p className="text-sm font-semibold text-foreground">
                Are you sure? This deletes everything and can&rsquo;t be undone.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your subscription stops billing immediately and your account is
                erased. You&rsquo;ll have to sign up and set up again to come back.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmCancel}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  {busy ? "Canceling…" : "Yes, cancel & delete everything"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                >
                  Never mind
                </Button>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </Card>
  );
}
