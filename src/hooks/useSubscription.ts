import { useEffect, useState } from "react";
import { getSupabase, isBillingEnabled, isDemoMode } from "@/lib/supabase";
import { fetchSubscription, hasActiveAccess } from "@/lib/subscription";

interface SubscriptionState {
  loading: boolean;
  /** True when the user may access the dashboard. */
  active: boolean;
  plan: string | null;
}

/**
 * Resolve whether the current user has dashboard access.
 *
 * When billing is disabled (open beta) or in demo mode, access is always
 * granted. When enabled, access requires a trialing/active subscription row.
 * Fails OPEN on a lookup error so a transient DB hiccup can't lock a paying
 * customer out of the product they're paying for.
 */
export function useSubscription(): SubscriptionState {
  const gated = isBillingEnabled && !isDemoMode;
  const [state, setState] = useState<SubscriptionState>({
    loading: gated,
    active: !gated,
    plan: null,
  });

  useEffect(() => {
    if (!gated) return;
    let alive = true;
    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) throw new Error("not_configured");
        const sub = await fetchSubscription(supabase);
        if (!alive) return;
        setState({ loading: false, active: hasActiveAccess(sub), plan: sub?.plan ?? null });
      } catch {
        // Fail open — never lock someone out on an error.
        if (alive) setState({ loading: false, active: true, plan: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, [gated]);

  return state;
}
