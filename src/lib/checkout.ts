import type { NavigateFunction } from "react-router-dom";
import type { Plan } from "@/data/plans";

/**
 * Start the trial / checkout flow for a plan.
 *
 * Each plan carries a Stripe Payment Link, so this sends the customer straight
 * to Stripe's hosted checkout (14-day free trial, then the monthly price). If a
 * plan ever has no link configured, it falls back to the in-app signup.
 */
export function startCheckout(plan: Plan, navigate: NavigateFunction): void {
  if (plan.paymentLink) {
    window.location.href = plan.paymentLink;
    return;
  }
  navigate(`/signup?plan=${plan.id}`);
}
