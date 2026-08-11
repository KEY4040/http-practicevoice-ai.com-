/**
 * Netlify Function: cancel-subscription
 * ---------------------------------------------------------------------------
 * The owner-facing "Cancel my subscription" action. It cancels the customer's
 * Stripe subscription IMMEDIATELY (billing stops now). It does NOT delete the
 * account — the clinic, settings, calls, and appointments all stay, so the owner
 * can resubscribe later and pick up where they left off.
 *
 * When Stripe cancels, it fires customer.subscription.deleted to our
 * stripe-webhook, which flips the subscription status to "canceled" (locking the
 * dashboard) and reclaims the Retell number so it stops costing money. So this
 * function only has to tell Stripe to cancel — the webhook does the rest.
 *
 * Requires STRIPE_SECRET_KEY (to call the Stripe API). Without it the button is
 * safely inert: it returns a clear message and changes nothing.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY
 */
import { hasSupabase, sbSelect } from "../shared/supabase.mjs";
import { getUserId, bearer } from "../shared/auth.mjs";
import { hasStripeSecret, cancelStripeSubscription } from "../shared/stripe.mjs";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!hasSupabase()) return json({ ok: false, error: "supabase_not_configured" }, 500);

  const uid = await getUserId(bearer(req));
  if (!uid) return json({ ok: false, error: "not_signed_in" }, 401);

  if (!hasStripeSecret()) {
    return json(
      {
        ok: false,
        error: "billing_not_configured",
        message:
          "Cancellation isn't switched on yet. Add STRIPE_SECRET_KEY in Netlify to enable it — until then nothing was changed.",
      },
      503
    );
  }

  const subs = await sbSelect(
    "subscriptions",
    `select=stripe_subscription_id&user_id=eq.${encodeURIComponent(uid)}&limit=1`
  );
  const subscriptionId = subs[0]?.stripe_subscription_id || null;
  // Nothing to cancel (e.g. already canceled) — treat as success so the UI is
  // consistent; the account stays intact either way.
  if (!subscriptionId) return json({ ok: true, note: "no_active_subscription" });

  const cancel = await cancelStripeSubscription(subscriptionId);
  if (!cancel.ok) {
    return json(
      {
        ok: false,
        error: "cancel_failed",
        message: "We couldn't cancel your subscription just now — please try again in a moment.",
        detail: cancel.error,
      },
      502
    );
  }

  // The stripe-webhook (subscription.deleted) sets status=canceled and reclaims
  // the Retell number. The account and all its data stay put for a future resub.
  return json({ ok: true });
};
