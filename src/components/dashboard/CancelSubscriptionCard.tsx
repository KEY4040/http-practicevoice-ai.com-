import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Loader2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cancelSubscription } from "@/lib/cancelSubscription";

/**
 * Cancel-subscription card (bottom of Settings). Two-step so it can't fire by
 * accident. Cancels billing immediately but KEEPS the account and setup — the
 * owner can resubscribe anytime and pick up where they left off.
 */
export function CancelSubscriptionCard() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmCancel() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await cancelSubscription();
    setBusy(false);
    if (r.status === "ok") {
      setDone(true);
      setConfirming(false);
      return;
    }
    setError(
      r.message ||
        (r.status === "not_configured"
          ? "Cancellation isn't switched on yet — contact support."
          : "Couldn't cancel just now — please try again.")
    );
  }

  if (done) {
    return (
      <Card className="border-accent/30 bg-accent/[0.05] p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent-hover">
            <Check className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Subscription canceled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Billing has stopped. Your setup is saved — resubscribe anytime to
              turn your AI line back on and pick up right where you left off.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/billing">View plans</Link>
            </Button>
          </div>
        </div>
      </Card>
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
            Stops your billing right away. Your account and setup are kept — your
            AI line just pauses, and you can resubscribe anytime to bring it back.
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
                Cancel your subscription?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Billing stops immediately and your AI line pauses. Your setup
                stays saved so you can resubscribe whenever you want.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="destructive" onClick={confirmCancel} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  {busy ? "Canceling…" : "Yes, cancel my subscription"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
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
