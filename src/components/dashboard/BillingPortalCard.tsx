import { useState } from "react";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { openBillingPortal } from "@/lib/billingPortal";

/**
 * "Manage billing" card (Settings). Opens the Stripe Billing Portal so the owner
 * can update their card, change plan, and download invoices — all self-serve.
 * Safely inert (clear message, no redirect) until STRIPE_SECRET_KEY + the Stripe
 * customer portal are configured.
 */
export function BillingPortalCard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await openBillingPortal();
    if (r.status === "ok" && r.url) {
      window.location.href = r.url;
      return; // leaving the page
    }
    setBusy(false);
    setError(
      r.message ||
        (r.status === "no_customer"
          ? "You don't have a billing account yet — start a plan first."
          : r.status === "not_configured"
            ? "Billing management isn't switched on yet — contact support."
            : "Couldn't open billing just now — please try again.")
    );
  }

  return (
    <Card className="border-border p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <CreditCard className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Billing &amp; invoices</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your card, change your plan, or download past invoices and
            receipts — all in one place.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={open} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
            {busy ? "Opening…" : "Manage billing"}
          </Button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </Card>
  );
}
