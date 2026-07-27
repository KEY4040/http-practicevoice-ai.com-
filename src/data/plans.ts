/**
 * Single source of truth for pricing plans.
 *
 * `paymentLink` is a Stripe Payment Link — clicking a plan's button sends the
 * customer straight to Stripe's hosted checkout ($9.99 activation today + a
 * 14-day trial, then the monthly price). To change a price or link, update it
 * here and in Stripe.
 */

export type PlanId = "basic" | "professional" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  tagline: string;
  cta: string;
  /** Stripe Payment Link the CTA opens. */
  paymentLink: string;
  highlighted?: boolean;
  badge?: string;
  features: string[];
}

/**
 * Included call-minutes per plan per month. These are ENFORCED server-side
 * (usage metering + auto-pause) — see netlify/shared/entitlement.mjs. There is
 * NO per-minute overage billing: when an account reaches its included minutes,
 * the line pauses until the month resets or the owner upgrades. Pricing copy
 * must reflect that (flat price, no surprise metered charges) — never advertise
 * a "then X¢/min" rate the system does not actually bill.
 */
export const PLAN_MINUTES: Record<PlanId, number> = {
  basic: 250,
  professional: 750,
  premium: 2000,
};
/** Minutes included in the paid $9.99 / 14-day trial. */
export const TRIAL_MINUTES = 60;

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 99,
    period: "/month",
    tagline: "For a single location that's done missing calls.",
    cta: "Start — $9.99 for 14 days",
    paymentLink: "https://buy.stripe.com/4gMcN52yha2edMFf4vcjS0k",
    features: [
      "250 call-minutes / mo included",
      "Flat price — no surprise overage bills",
      "1 AI phone number",
      "24/7 call answering & booking",
      "Answers in the caller's language (English, Spanish & more)",
      "Text appointment confirmations",
      "Call transcripts & summaries",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 199,
    period: "/month",
    tagline: "Everything a busy front desk needs — plus proof of the payoff.",
    cta: "Start — $9.99 for 14 days",
    paymentLink: "https://buy.stripe.com/fZu4gzgp73DQ6kdaOfcjS0m",
    highlighted: true,
    badge: "Most popular",
    features: [
      "750 call-minutes / mo included",
      "Flat price — no surprise overage bills",
      "Everything in Basic, plus:",
      "Revenue dashboard — see what calls earn you",
      "Calendar sync — Google & Outlook (coming soon)",
      "Smart text reminders & recalls",
      "Books across multiple staff",
      "Urgent calls routed to your team",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 399,
    period: "/month",
    tagline: "For groups and multi-location businesses.",
    cta: "Start — $9.99 for 14 days",
    paymentLink: "https://buy.stripe.com/8x24gz0q93DQ8slg8zcjS0l",
    features: [
      "2,000 call-minutes / mo included",
      "Flat price — no surprise overage bills",
      "Everything in Professional, plus:",
      "Multiple numbers & locations",
      "Custom voice & knowledge base",
      "Multi-location calendar sync (coming soon)",
      "Dedicated success manager",
      "HIPAA BAA available",
    ],
  },
];
