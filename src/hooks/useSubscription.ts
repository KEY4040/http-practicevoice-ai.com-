import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, isBillingEnabled, isDemoMode } from "@/lib/supabase";
import { fetchSubscription, hasActiveAccess, trialDaysLeft } from "@/lib/subscription";

/** Kick off a tester account's countdown on first sign-in (best-effort). */
async function startTesterClock(supabase: SupabaseClient): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch("/.netlify/functions/tester-clock", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* non-fatal — the clock will start on a later load */
  }
}

/** How the user currently has access, for banners + the paywall. */
export type AccessState = "open" | "trial" | "active" | "expired";

interface SubscriptionState {
  loading: boolean;
  /** True when the user may access the dashboard. */
  active: boolean;
  state: AccessState;
  /** Days left in the free trial (only meaningful when state === "trial"). */
  trialDaysLeft: number;
  plan: string | null;
}

/**
 * Resolve dashboard access under the reverse-trial model.
 *
 * - Billing off / demo: always open (no gating).
 * - Billing on: a paid/trialing Stripe subscription grants access; otherwise
 *   the account is in its free 14-day trial (counted from sign-up). When that
 *   runs out with no plan, access is "expired" and the paywall shows.
 *
 * Fails OPEN on any lookup error so a transient glitch never locks a customer
 * out of what they're paying for.
 */
export function useSubscription(): SubscriptionState {
  const gated = isBillingEnabled && !isDemoMode;
  const [state, setState] = useState<SubscriptionState>({
    loading: gated,
    active: !gated,
    state: "open",
    trialDaysLeft: 0,
    plan: null,
  });

  useEffect(() => {
    if (!gated) return;
    let alive = true;
    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) throw new Error("not_configured");

        const [{ data: userData }, sub] = await Promise.all([
          supabase.auth.getUser(),
          fetchSubscription(supabase),
        ]);

        if (!alive) return;

        // Time-boxed tester account: start the countdown on first sign-in
        // (best-effort; they still have access this session either way).
        if (sub?.tester_days && !sub.access_expires_at) {
          void startTesterClock(supabase);
        }

        if (hasActiveAccess(sub)) {
          setState({ loading: false, active: true, state: "active", trialDaysLeft: 0, plan: sub?.plan ?? null });
          return;
        }

        // A time-boxed account whose window has passed is EXPIRED — it must not
        // fall back into the 14-day reverse-trial (that would defeat the timer).
        if (sub?.access_expires_at || sub?.tester_days) {
          setState({ loading: false, active: false, state: "expired", trialDaysLeft: 0, plan: null });
          return;
        }

        const daysLeft = trialDaysLeft(userData.user?.created_at);
        if (daysLeft > 0) {
          setState({ loading: false, active: true, state: "trial", trialDaysLeft: daysLeft, plan: null });
        } else {
          setState({ loading: false, active: false, state: "expired", trialDaysLeft: 0, plan: null });
        }
      } catch {
        // Fail open — never lock someone out on an error.
        if (alive) setState({ loading: false, active: true, state: "open", trialDaysLeft: 0, plan: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, [gated]);

  return state;
}
