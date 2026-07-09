import type { NavigateFunction } from "react-router-dom";
import type { Plan } from "@/data/plans";

/** Optional signed-in identity so the payment reconciles to the account. */
export interface CheckoutIdentity {
  userId?: string;
  email?: string;
}

/**
 * Append the signed-in user's id/email to a Stripe Payment Link so the
 * stripe-webhook can map the resulting payment back to their account
 * (client_reference_id) and Stripe pre-fills their email.
 */
export function checkoutUrl(plan: Plan, identity?: CheckoutIdentity): string {
  if (!plan.paymentLink) return "";
  const url = new URL(plan.paymentLink);
  if (identity?.userId) url.searchParams.set("client_reference_id", identity.userId);
  if (identity?.email) url.searchParams.set("prefilled_email", identity.email);
  return url.toString();
}

/**
 * Start the trial / checkout flow for a plan.
 *
 * Sends the customer to Stripe's hosted checkout (14-day free trial, then the
 * monthly price), carrying their identity when known. Falls back to in-app
 * signup only if a plan somehow has no link configured.
 */
export function startCheckout(
  plan: Plan,
  navigate: NavigateFunction,
  identity?: CheckoutIdentity
): void {
  const url = checkoutUrl(plan, identity);
  if (url) {
    window.location.href = url;
    return;
  }
  navigate(`/signup?plan=${plan.id}`);
}
