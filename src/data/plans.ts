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

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 99,
    period: "/month",
    tagline: "For a single practice that's done missing calls.",
    cta: "Start free trial",
    paymentLink: "https://buy.stripe.com/4gMfZh8WF8Ya3812hJcjS0i",
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
    cta: "Start 14-day free trial",
    paymentLink: "https://buy.stripe.com/14A3cva0J0rE5g97C3cjS0h",
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
    cta: "Start free trial",
    paymentLink: "https://buy.stripe.com/14A3cvb4N3DQ7oh7C3cjS0g",
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
