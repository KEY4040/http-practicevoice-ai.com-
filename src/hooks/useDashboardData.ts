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
import {
  metrics as mockMetrics,
  calls as mockCalls,
  callsOverTime as mockCallsOverTime,
  revenueByType as mockRevenueByType,
  getCallById,
  type Call,
  type Metric,
} from "@/data/mockData";

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
}

function sumRevenue(calls: Call[]): number {
  return calls.reduce((sum, c) => sum + (c.revenue || 0), 0);
}

export function useDashboardData(): DashboardData {
  // The public /demo view forces mock data even when Supabase is configured.
  const demo = isDemoMode || useDemoView().demo;
  const [state, setState] = useState<DashboardData>({
    loading: !demo,
    isDemo: demo,
    error: null,
    calls: demo ? mockCalls : [],
    metrics: demo ? mockMetrics : [],
    callsOverTime: demo ? mockCallsOverTime : [],
    revenueByType: demo ? mockRevenueByType : [],
    totalRevenue: demo ? mockRevenueByType.reduce((s, r) => s + r.value, 0) : 0,
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
  const demo = isDemoMode || useDemoView().demo;
  const [state, setState] = useState<CallDetailData>({
    loading: !demo,
    error: null,
    call: demo && id ? getCallById(id) ?? null : null,
  });

  useEffect(() => {
    if (demo) {
      setState({ loading: false, error: null, call: id ? getCallById(id) ?? null : null });
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
  }, [id, demo]);

  return state;
}
