/**
 * Netlify Function: stripe-webhook
 * ---------------------------------------------------------------------------
 * The endpoint Stripe calls after a checkout / subscription change. Set it as a
 * webhook in the Stripe dashboard (Developers → Webhooks):
 *
 *   https://practicevoice-ai.com/.netlify/functions/stripe-webhook
 *
 * It verifies the Stripe signature, then writes the customer's plan status into
 * the `subscriptions` table so the app can unlock the dashboard. This is what
 * ties "money in Stripe" to "access in the product."
 *
 * Env:
 *   STRIPE_WEBHOOK_SECRET        signing secret from the Stripe webhook (whsec_…)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Checkout must carry the account id: our Billing page appends
 * `client_reference_id=<supabase user id>` to the Payment Link, which arrives on
 * checkout.session.completed and keys the subscription row.
 */
import { hasSupabase, sbInsert, sbUpdate } from "../shared/supabase.mjs";
import { verifyStripeSignature } from "../shared/stripe.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const raw = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — rejecting.");
    return json({ ok: false, error: "not_configured" }, 401);
  }
  if (!verifyStripeSignature(raw, sig, secret)) {
    return json({ ok: false, error: "bad_signature" }, 401);
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (!hasSupabase()) {
    console.warn("[stripe-webhook] Supabase not configured — acknowledging without write.");
    return json({ ok: true, skipped: "no_supabase" });
  }

  try {
    const obj = event?.data?.object ?? {};
    switch (event.type) {
      case "checkout.session.completed": {
        const userId = obj.client_reference_id;
        if (!userId) {
          console.error("[stripe-webhook] checkout.session.completed missing client_reference_id — cannot map to a user.");
          return json({ ok: false, error: "no_client_reference" }, 200);
        }
        // A subscription with a trial arrives as "trialing"; a straight paid
        // checkout is "active". subscription.updated events refine this later.
        const status = obj.payment_status === "paid" ? "active" : "trialing";
        await sbInsert(
          "subscriptions",
          {
            user_id: userId,
            status,
            stripe_customer_id: obj.customer ?? null,
            stripe_subscription_id: obj.subscription ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const customer = obj.customer;
        if (!customer) break;
        const status =
          event.type === "customer.subscription.deleted" ? "canceled" : obj.status;
        const periodEnd = obj.current_period_end
          ? new Date(obj.current_period_end * 1000).toISOString()
          : null;
        const plan = obj.items?.data?.[0]?.price?.nickname ?? null;
        // Match the row we created at checkout by its Stripe customer id.
        await sbUpdate(
          "subscriptions",
          `stripe_customer_id=eq.${encodeURIComponent(customer)}`,
          {
            status,
            current_period_end: periodEnd,
            plan,
            stripe_subscription_id: obj.id ?? null,
            updated_at: new Date().toISOString(),
          }
        );
        break;
      }
      default:
        // Ignore everything else.
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] handler failed:", err);
    return json({ ok: false, error: "handler_failed" }, 500);
  }

  return json({ ok: true });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
