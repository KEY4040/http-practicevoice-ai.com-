import type { SupabaseClient } from "@supabase/supabase-js";

/** A row from the `subscriptions` table (the fields the app reads). */
export interface Subscription {
  status: string;
  plan: string | null;
  current_period_end: string | null;
}

/** Stripe statuses that grant dashboard access (trial + paid + short grace). */
const ACTIVE_STATUSES = new Set(["trialing", "active", "past_due"]);

/** Whether a subscription (or lack of one) should unlock the dashboard. */
export function hasActiveAccess(sub: Subscription | null): boolean {
  return !!sub && ACTIVE_STATUSES.has(sub.status);
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
