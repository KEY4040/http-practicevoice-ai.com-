import type { SupabaseClient } from "@supabase/supabase-js";

/** A row from the `subscriptions` table (the fields the app reads). */
export interface Subscription {
  status: string;
  plan: string | null;
  current_period_end: string | null;
}

/** Stripe statuses that grant dashboard access (trial + paid + short grace). */
const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

/** Length of the free reverse-trial (no card) that starts at sign-up. */
export const TRIAL_DAYS = 14;

/** Whether a paid/Stripe subscription is currently active. */
export function hasActiveAccess(sub: Subscription | null): boolean {
  return !!sub && ACTIVE_STATUSES.has(sub.status);
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
    .select("status, plan, current_period_end")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data as Subscription | null) ?? null;
}
