/**
 * Data source for the dashboard pages.
 *
 * - Demo mode (marketing preview / local dev): returns the rich mock dataset so
 *   the product always looks alive.
 * - Connected mode (Supabase configured + signed in): loads the owner's real
 *   clinic, calls, and appointments and derives the same metric/chart shapes.
 *
 * Because both paths return identical shapes, the pages don't branch on it.
 */
import { useEffect, useState } from "react";
import { getSupabase, isDemoMode } from "@/lib/supabase";
import { useDemoView } from "@/context/DemoView";
import { getOrCreateClinic } from "@/lib/clinic";
import {
  fetchCall,
  fetchCalls,
  deriveMetrics,
  deriveCallsOverTime,
  deriveRevenueByType,
  type CallsOverTimePoint,
  type RevenueByType,
} from "@/lib/dashboardData";
import { type Call, type Metric } from "@/data/mockData";
import { getDemoDataset, getDemoCallById } from "@/data/demoDatasets";

export interface DashboardData {
  loading: boolean;
  isDemo: boolean;
  error: string | null;
  calls: Call[];
  metrics: Metric[];
  callsOverTime: CallsOverTimePoint[];
  revenueByType: RevenueByType[];
  /** Total revenue across ALL calls (not just the top revenueByType slices). */
  totalRevenue: number;
  /** The clinic's live AI number, or null if they haven't activated one yet. */
  aiNumber: string | null;
  /** Call-minutes used this month (for the usage meter). */
  usageMinutes: number;
  /** True when the line is paused for hitting its monthly minute cap. */
  usageSuspended: boolean;
}

function sumRevenue(calls: Call[]): number {
  return calls.reduce((sum, c) => sum + (c.revenue || 0), 0);
}

export function useDashboardData(): DashboardData {
  // The public /demo view forces mock data even when Supabase is configured.
  // In the demo, ?industry= selects the matching dataset (legal, home-services,
  // …) so call history and revenue tell one consistent story; default = dental.
  const { demo: demoView, industry } = useDemoView();
  const demo = isDemoMode || demoView;
  const ds = getDemoDataset(industry);
  const [state, setState] = useState<DashboardData>({
    loading: !demo,
    isDemo: demo,
    error: null,
    calls: demo ? ds.calls : [],
    metrics: demo ? ds.metrics : [],
    callsOverTime: demo ? ds.callsOverTime : [],
    revenueByType: demo ? ds.revenueByType : [],
    totalRevenue: demo ? ds.revenueByType.reduce((s, r) => s + r.value, 0) : 0,
    aiNumber: demo ? ds.aiNumber : null,
    usageMinutes: demo ? 128 : 0,
    usageSuspended: false,
  });

  useEffect(() => {
    if (demo) return;
    let active = true;

    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) throw new Error("not_configured");
        // Don't seed the clinic name from the demo default ("Bayview Dental");
        // getOrCreateClinic falls back to a neutral "My Practice" that the owner
        // renames in Settings.
        const clinic = await getOrCreateClinic(supabase);
        if (!clinic) throw new Error("no_clinic");
        const calls = await fetchCalls(supabase, clinic.id);
        if (!active) return;
        setState({
          loading: false,
          isDemo: false,
          error: null,
          calls,
          metrics: deriveMetrics(calls),
          callsOverTime: deriveCallsOverTime(calls),
          revenueByType: deriveRevenueByType(calls),
          totalRevenue: sumRevenue(calls),
          aiNumber: clinic.retell_number ?? null,
          usageMinutes: Math.round(Number(clinic.usage_minutes ?? 0)),
          usageSuspended: Boolean(clinic.usage_suspended),
        });
      } catch (err) {
        if (!active) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "load_failed",
        }));
      }
    })();

    return () => {
      active = false;
    };
  }, [demo]);

  return state;
}

export interface CallDetailData {
  loading: boolean;
  error: string | null;
  call: Call | null;
}

/** Load a single call for the detail page (mock in demo mode, DB otherwise). */
export function useCall(id: string | undefined): CallDetailData {
  const { demo: demoView, industry } = useDemoView();
  const demo = isDemoMode || demoView;
  const [state, setState] = useState<CallDetailData>({
    loading: !demo,
    error: null,
    call: demo && id ? getDemoCallById(industry, id) ?? null : null,
  });

  useEffect(() => {
    if (demo) {
      setState({ loading: false, error: null, call: id ? getDemoCallById(industry, id) ?? null : null });
      return;
    }
    if (!id) {
      setState({ loading: false, error: null, call: null });
      return;
    }
    let active = true;

    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) throw new Error("not_configured");
        const clinic = await getOrCreateClinic(supabase);
        if (!clinic) throw new Error("no_clinic");
        const call = await fetchCall(supabase, clinic.id, id);
        if (!active) return;
        setState({ loading: false, error: null, call });
      } catch (err) {
        if (!active) return;
        setState({
          loading: false,
          error: err instanceof Error ? err.message : "load_failed",
          call: null,
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [id, demo, industry]);

  return state;
}
