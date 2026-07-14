/**
 * Single source of truth for pricing plans.
 *
 * `paymentLink` is a Stripe Payment Link — clicking a plan's button sends the
 * customer straight to Stripe's hosted checkout (14-day free trial, then the
 * monthly price). To change a price or link, update it here and in Stripe.
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
 * Included call-minutes per plan per month, and the overage rate charged after.
 * These are ENFORCED server-side (usage metering + auto-pause) — see
 * netlify/shared/entitlement.mjs. Priced so every plan keeps a healthy margin
 * over the ~$0.13/min voice cost even at full usage, with overage above cost.
 */
export const PLAN_MINUTES: Record<PlanId, number> = {
  basic: 250,
  professional: 750,
  premium: 2000,
};
export const PLAN_OVERAGE: Record<PlanId, string> = {
  basic: "35¢/min",
  professional: "30¢/min",
  premium: "25¢/min",
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
      "then 35¢/min — never a surprise",
      "1 AI phone number",
      "24/7 call answering & booking",
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
    paymentLink: "https://buy.stripe.com/14A3cva0J0rE5g97C3cjS0h",
    highlighted: true,
    badge: "Most popular",
    features: [
      "750 call-minutes / mo included",
      "then 30¢/min",
      "Everything in Basic, plus:",
      "Revenue dashboard — see what calls earn you",
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
    paymentLink: "https://buy.stripe.com/14A3cvb4N3DQ7oh7C3cjS0g",
    features: [
      "2,000 call-minutes / mo included",
      "then 25¢/min",
      "Everything in Professional, plus:",
      "Multiple numbers & locations",
      "Custom voice & knowledge base",
      "Booking & software integrations",
      "Dedicated success manager",
      "HIPAA BAA available",
    ],
  },
];
