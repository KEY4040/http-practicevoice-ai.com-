/**
 * Netlify Function: cancel-account
 * ---------------------------------------------------------------------------
 * The owner-facing "Cancel subscription & delete my account" action. It:
 *   1. Verifies the signed-in user.
 *   2. Cancels their Stripe subscription IMMEDIATELY (billing stops now).
 *   3. Tears down their Retell line (number -> agent -> llm) so it stops costing.
 *   4. Deletes their auth user — which CASCADES to their clinic, calls,
 *      appointments, and subscription row (all ON DELETE CASCADE). So the
 *      account is fully gone and they'd re-register to use the product again.
 *
 * Order matters: read what we need, stop the money (Stripe), stop the Retell
 * spend, THEN delete. Billing is the safety-critical step — if the Stripe secret
 * key isn't configured we ABORT and delete nothing, so we can never delete an
 * account while it's still being billed.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, RETELL_API_KEY
 */
import { hasSupabase, sbSelect, deleteAuthUser } from "../shared/supabase.mjs";
import { getUserId, bearer } from "../shared/auth.mjs";
import { hasStripeSecret, cancelStripeSubscription } from "../shared/stripe.mjs";
import { hasRetell, teardownRetell } from "../shared/retell-api.mjs";

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

  // SAFETY GATE: never delete an account we can't stop billing. Canceling the
  // Stripe subscription requires the secret key — if it's absent, abort now and
  // touch nothing, so the owner is never left deleted-but-still-charged.
  if (!hasStripeSecret()) {
    return json(
      {
        ok: false,
        error: "billing_not_configured",
        message:
          "Account cancellation isn't switched on yet. Add STRIPE_SECRET_KEY in Netlify to enable it — until then nothing was changed.",
      },
      503
    );
  }

  // Read what we need BEFORE deleting anything.
  const subs = await sbSelect(
    "subscriptions",
    `select=stripe_subscription_id&user_id=eq.${encodeURIComponent(uid)}&limit=1`
  );
  const subscriptionId = subs[0]?.stripe_subscription_id || null;

  const clinics = await sbSelect(
    "clinics",
    `select=id,retell_number,retell_agent_id,retell_llm_id&owner_id=eq.${encodeURIComponent(uid)}&limit=1`
  );
  const clinic = clinics[0] || null;

  // 1) Stop the money first. If Stripe cancellation truly fails, abort — do NOT
  //    delete the account while a live subscription could keep billing.
  const cancel = await cancelStripeSubscription(subscriptionId);
  if (!cancel.ok) {
    return json(
      {
        ok: false,
        error: "cancel_failed",
        message:
          "We couldn't cancel your subscription just now, so we did NOT delete anything. Please try again in a moment.",
        detail: cancel.error,
      },
      502
    );
  }

  // 2) Stop the Retell line's spend (best-effort — never blocks the delete).
  if (hasRetell() && clinic) {
    try {
      await teardownRetell(clinic);
    } catch (e) {
      console.error("[cancel-account] Retell teardown failed (continuing):", (e && e.message) || e);
    }
  }

  // 3) Delete the auth user -> cascades to clinic, calls, appointments, sub.
  const deleted = await deleteAuthUser(uid);
  if (!deleted) {
    return json(
      {
        ok: false,
        error: "delete_failed",
        message:
          "Your subscription was canceled, but we hit a snag deleting your account data. Contact support and we'll finish it.",
      },
      500
    );
  }

  return json({ ok: true });
};
