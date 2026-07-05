/**
 * Single source of truth for pricing plans.
 *
 * Used by the Pricing page and the checkout helper. When you connect Stripe,
 * you only touch two things: set the `VITE_STRIPE_PRICE_*` env vars, and swap
 * the body of `startCheckout` in `src/lib/checkout.ts`. Nothing else changes.
 */

export type PlanId = "basic" | "professional" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  tagline: string;
  /** CTA behavior: "trial" starts the free-trial/checkout flow; "sales" emails sales. */
  action: "trial" | "sales";
  cta: string;
  highlighted?: boolean;
  badge?: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 99,
    period: "/month",
    tagline: "For a single practice that's done missing calls.",
    action: "trial",
    cta: "Start free trial",
    features: [
      "Up to 300 calls answered / mo",
      "24/7 call answering & booking",
      "Google Calendar sync",
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
    action: "trial",
    cta: "Start 14-day free trial",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Up to 1,500 calls answered / mo",
      "Everything in Basic, plus:",
      "Revenue dashboard — see what calls earn you",
      "Smart text reminders & recalls",
      "Books across multiple providers",
      "Urgent calls routed to your team",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 399,
    period: "/month",
    tagline: "For groups and multi-location practices.",
    action: "sales",
    cta: "Talk to sales",
    features: [
      "Unlimited calls answered",
      "Everything in Professional, plus:",
      "Multiple locations in one place",
      "Custom voice & knowledge base",
      "EHR / practice-software integrations",
      "Dedicated success manager",
      "HIPAA BAA included",
    ],
  },
];
