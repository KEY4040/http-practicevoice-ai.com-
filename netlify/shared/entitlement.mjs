/**
 * Usage allowances — the single source of truth for how many call-minutes an
 * account gets per month, used by the webhook (to auto-pause an over-limit line)
 * and the scheduled sweep (to un-pause when the month resets or they upgrade).
 *
 * Priced so every plan keeps margin over the ~$0.13/min voice cost:
 *   Basic $99 -> 250 min, Pro $199 -> 750 min, Premium $399 -> 2000 min.
 * The paid $9.99 / 14-day trial (Stripe status "trialing") gets 60 min — enough
 * to test, capped so a trial can never cost more than the $9.99 collected.
 */
export const PLAN_MINUTES = { basic: 250, professional: 750, premium: 2000 };
export const TRIAL_MINUTES = 60;

/** Map a Stripe plan nickname ("Premium", "Professional", "Basic") to a key. */
export function planKeyFromName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("premium")) return "premium";
  if (n.includes("professional") || n.includes("pro")) return "professional";
  return "basic";
}

/**
 * Amount actually charged (in cents) -> plan key. The amount is far more stable
 * than a human-editable price nickname: renaming a Stripe price is common and
 * used to silently cap a paying customer at the lowest tier; changing the amount
 * is rare and deliberate. Prices: Basic $99, Professional $199, Premium $399.
 */
export const PLAN_AMOUNTS = { 9900: "basic", 19900: "professional", 39900: "premium" };

/**
 * Resolve a plan key from a Stripe price object, most-stable signal first:
 * unit_amount -> lookup_key -> nickname. Falls back to "basic" so a live paid
 * line is never left with zero allowance.
 */
export function planKeyFromPrice(price) {
  if (!price) return "basic";
  if (price.unit_amount && PLAN_AMOUNTS[price.unit_amount]) {
    return PLAN_AMOUNTS[price.unit_amount];
  }
  return planKeyFromName(price.lookup_key || price.nickname || "");
}

/**
 * Included minutes for a subscription row this period.
 *   - tester account (tester_days set): full Premium bucket, so a controlled
 *     tester can exercise everything.
 *   - trialing (the paid $9.99 trial, or a plan still in its 14-day trial): 60.
 *   - active/past_due: their plan's bucket.
 *   - anything else / no sub: 0 (they can't have a live line anyway).
 */
export function allowanceMinutes(sub) {
  if (!sub) return 0;
  if (sub.tester_days) return PLAN_MINUTES.premium;
  if (sub.status === "trialing") return TRIAL_MINUTES;
  if (sub.status === "active" || sub.status === "past_due") {
    return PLAN_MINUTES[planKeyFromName(sub.plan)] ?? PLAN_MINUTES.basic;
  }
  return 0;
}

/** UTC first-of-month timestamp — the usage period boundary. */
export function monthStartIso(now = Date.now()) {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}
