import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Gate dashboard content behind an active subscription/trial.
 *
 * No-ops (renders children immediately) when billing is disabled or in demo
 * mode — see useSubscription. When enforced and the user has no active plan,
 * redirects them to /billing to start their trial.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { loading, active } = useSubscription();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!active) {
    return <Navigate to="/billing" replace />;
  }

  return <>{children}</>;
}
