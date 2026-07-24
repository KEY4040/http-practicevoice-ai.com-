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
import { hasSupabase, sbSelect, sbInsert, sbUpdate } from "../shared/supabase.mjs";
import { verifyStripeSignature } from "../shared/stripe.mjs";
import { planKeyFromPrice } from "../shared/entitlement.mjs";
import {
  hasRetell,
  deleteNumber,
  deleteAgent,
  deleteLlm,
} from "../shared/retell-api.mjs";

/**
 * Tear down a canceled/expired customer's provisioned Retell line so their
 * phone number stops billing. Finds the clinic via the subscription's
 * stripe_customer_id -> user_id -> clinic.owner_id, deletes number -> agent ->
 * llm (order matters), and clears the ids. Best-effort + non-fatal.
 */
async function teardownForCustomer(customerId) {
  if (!hasRetell() || !customerId) return;
  try {
    const subs = await sbSelect(
      "subscriptions",
      `select=user_id&stripe_customer_id=eq.${encodeURIComponent(customerId)}&limit=1`
    );
    const uid = subs[0]?.user_id;
    if (!uid) return;
    const clinics = await sbSelect(
      "clinics",
      `select=id,retell_number,retell_agent_id,retell_llm_id&owner_id=eq.${uid}&limit=1`
    );
    const clinic = clinics[0];
    if (!clinic) return;
    if (clinic.retell_number) await deleteNumber(clinic.retell_number).catch(() => {});
    if (clinic.retell_agent_id) await deleteAgent(clinic.retell_agent_id).catch(() => {});
    if (clinic.retell_llm_id) await deleteLlm(clinic.retell_llm_id).catch(() => {});
    await sbUpdate("clinics", `id=eq.${clinic.id}`, {
      retell_number: null,
      retell_agent_id: null,
      retell_llm_id: null,
    });
    console.log(`[stripe-webhook] tore down Retell line for clinic ${clinic.id}`);
  } catch (e) {
    console.error("[stripe-webhook] teardown failed (non-fatal):", e.message);
  }
}

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
        // A subscription checkout starts as "trialing" — a SAFE FLOOR that keeps
        // the 60-min trial cap in force — and the customer.subscription.* events
        // (which fire moments later) set the authoritative status. We must NOT
        // infer "active" from payment_status: the $9.99 activation fee makes
        // payment_status "paid" even while the plan is still in its 14-day trial,
        // which would otherwise wrongly unlock the full plan allowance early.
        const status = obj.subscription
          ? "trialing"
          : obj.payment_status === "paid"
            ? "active"
            : "trialing";
        await sbInsert(
          "subscriptions",
          {
            user_id: userId,
            status,
            stripe_customer_id: obj.customer ?? null,
            stripe_subscription_id: obj.subscription ?? null,
            // If a former tester account converts to a real paid plan, clear the
            // time-box so the hard-expiry check never locks the paying customer out.
            access_expires_at: null,
            tester_days: null,
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
        // Store the canonical plan KEY resolved from the price amount (stable),
        // not the raw nickname — a renamed Stripe price must never silently cap a
        // paying customer's allowance.
        const priceObj = obj.items?.data?.[0]?.price ?? null;
        const plan = priceObj ? planKeyFromPrice(priceObj) : null;
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
        // Trial ended without payment / canceled / unpaid -> reclaim the number
        // so it stops costing money. (This is the "shuts off after 14 days".)
        if (["canceled", "unpaid", "incomplete_expired"].includes(status)) {
          await teardownForCustomer(customer);
        }
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
