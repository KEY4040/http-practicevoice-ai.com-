/**
 * Netlify Function: billing-portal
 * ---------------------------------------------------------------------------
 * Opens a Stripe Billing Portal session for the signed-in owner so they can
 * self-serve: update their card, change plan, and download invoices/receipts.
 * Returns a one-time Stripe URL the client redirects to.
 *
 * Requires STRIPE_SECRET_KEY and the Billing Portal enabled once in the Stripe
 * dashboard (Settings → Billing → Customer portal). Without either, it returns
 * a clear message and changes nothing.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY
 */
import { hasSupabase, sbSelect } from "../shared/supabase.mjs";
import { getUserId, bearer } from "../shared/auth.mjs";
import { hasStripeSecret, createBillingPortalSession } from "../shared/stripe.mjs";

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
        message: "Billing management isn't switched on yet — contact support.",
      },
      503
    );
  }

  // The portal is tied to the customer's Stripe id, which we stored at checkout.
  const subs = await sbSelect(
    "subscriptions",
    `select=stripe_customer_id&user_id=eq.${encodeURIComponent(uid)}&limit=1`
  );
  const customerId = subs[0]?.stripe_customer_id || null;
  if (!customerId) {
    return json(
      {
        ok: false,
        error: "no_customer",
        message: "You don't have a billing account yet — start a plan first.",
      },
      400
    );
  }

  const returnUrl = "https://practicevoice-ai.com/dashboard/settings";
  const r = await createBillingPortalSession(customerId, returnUrl);
  if (!r.ok || !r.url) {
    return json(
      {
        ok: false,
        error: "portal_failed",
        message:
          "We couldn't open billing right now. If this keeps happening, contact support.",
        detail: r.error,
      },
      502
    );
  }

  return json({ ok: true, url: r.url });
};
