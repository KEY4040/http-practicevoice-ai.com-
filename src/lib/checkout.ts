import type { NavigateFunction } from "react-router-dom";
import type { Plan, PlanId } from "@/data/plans";

/**
 * Stripe wiring lives here — the frontend is ready, Stripe just isn't connected
 * yet. To go live:
 *   1. Create three Prices in Stripe and set these env vars:
 *        VITE_STRIPE_PRICE_BASIC, VITE_STRIPE_PRICE_PROFESSIONAL, VITE_STRIPE_PRICE_PREMIUM
 *   2. Replace the body of `startCheckout` below with a redirect to a Stripe
 *      Checkout Session created for `getStripePriceId(plan.id)`.
 * Every "Start free trial" button already routes through here, so no button or
 * page needs to change when you do.
 */

const PRICE_IDS: Record<PlanId, string | undefined> = {
  basic: import.meta.env.VITE_STRIPE_PRICE_BASIC,
  professional: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL,
  premium: import.meta.env.VITE_STRIPE_PRICE_PREMIUM,
};

/** The Stripe Price ID for a plan, once configured via env vars. */
export function getStripePriceId(planId: PlanId): string | undefined {
  return PRICE_IDS[planId];
}

/** Whether Stripe is configured for a given plan yet. */
export function isStripeReady(planId: PlanId): boolean {
  return Boolean(PRICE_IDS[planId]);
}

/**
 * Kick off the trial / checkout flow for a plan.
 *
 * Until Stripe is connected, this routes to the free-trial signup and remembers
 * which plan was chosen (via `?plan=`). Swap the body for a Stripe Checkout
 * redirect when ready — see the note at the top of this file.
 */
export function startCheckout(plan: Plan, navigate: NavigateFunction): void {
  // TODO(stripe): create a Checkout Session for getStripePriceId(plan.id) on
  // your server, then: window.location.href = session.url;
  navigate(`/signup?plan=${plan.id}`);
}
