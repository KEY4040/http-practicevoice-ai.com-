import type { SupabaseClient } from "@supabase/supabase-js";

/** A row from the `subscriptions` table (the fields the app reads). */
export interface Subscription {
  status: string;
  plan: string | null;
  current_period_end: string | null;
  /**
   * Hard access cutoff. When set and in the past, access is DENIED regardless
   * of status — used for time-boxed accounts (e.g. a 4-day tester login).
   * Null/absent for normal accounts.
   */
  access_expires_at?: string | null;
  /**
   * When set, this is a time-boxed tester account: its countdown is this many
   * days and starts (stamps access_expires_at) on first sign-in. Null for
   * normal accounts.
   */
  tester_days?: number | null;
}

/** Stripe statuses that grant dashboard access (trial + paid + short grace). */
const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

/** Length of the free reverse-trial (no card) that starts at sign-up. */
export const TRIAL_DAYS = 14;

/** Whether a paid/Stripe subscription is currently active. */
export function hasActiveAccess(sub: Subscription | null): boolean {
  if (!sub) return false;
  // Hard expiry wins over status (time-boxed tester accounts).
  if (sub.access_expires_at) {
    const exp = new Date(sub.access_expires_at).getTime();
    if (!Number.isNaN(exp) && exp <= Date.now()) return false;
  }
  return ACTIVE_STATUSES.has(sub.status);
}

/**
 * Days left in the free reverse-trial, counted from the account's creation
 * date. 0 means the trial has ended. Unknown/invalid dates return the full
 * trial length so a lookup glitch never locks someone out.
 */
export function trialDaysLeft(
  createdAt: string | null | undefined,
  now: Date = new Date()
): number {
  if (!createdAt) return TRIAL_DAYS;
  const start = new Date(createdAt).getTime();
  if (Number.isNaN(start)) return TRIAL_DAYS;
  const remainingMs = start + TRIAL_DAYS * 86_400_000 - now.getTime();
  return remainingMs <= 0 ? 0 : Math.ceil(remainingMs / 86_400_000);
}

/** Read the signed-in user's subscription. Returns null if they have none. */
export async function fetchSubscription(
  supabase: SupabaseClient
): Promise<Subscription | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, plan, current_period_end, access_expires_at, tester_days")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data as Subscription | null) ?? null;
}
