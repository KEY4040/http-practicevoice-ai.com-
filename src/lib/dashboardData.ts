/**
 * Turns real Supabase rows into the exact shapes the dashboard UI already
 * renders (Call, Metric, chart series, revenue breakdown). Keeping the derived
 * shapes identical to the mock data means the pages don't care whether they're
 * showing demo content or a live clinic's numbers.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Call,
  CallOutcome,
  CallTranscriptLine,
  Metric,
} from "@/data/mockData";
import { formatAppointmentWhen } from "@/lib/utils";

export interface CallsOverTimePoint {
  day: string;
  calls: number;
  booked: number;
}

export interface RevenueByType {
  type: string;
  value: number;
}

/** Shape of a `calls` row (with its appointment embedded) as returned by PostgREST. */
interface CallRow {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  started_at: string;
  duration_sec: number | null;
  outcome: CallOutcome;
  reason: string | null;
  summary: string | null;
  transcript: unknown;
  revenue: number | string | null;
  notes: string | null;
  appointments?: AppointmentRow[] | null;
}

interface AppointmentRow {
  type: string | null;
  provider: string | null;
  scheduled_for: string | null;
  patient_name: string | null;
}

const CALL_SELECT =
  "id, caller_name, caller_phone, started_at, duration_sec, outcome, reason, summary, transcript, revenue, notes, appointments(type, provider, scheduled_for, patient_name)";

function toTranscript(value: unknown): CallTranscriptLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (l): l is CallTranscriptLine =>
        !!l &&
        typeof l === "object" &&
        "speaker" in l &&
        "text" in l &&
        (l.speaker === "ai" || l.speaker === "caller")
    )
    .map((l) => ({ speaker: l.speaker, text: String(l.text) }));
}

/** Map one database row to the `Call` shape the UI components expect. */
export function mapCall(row: CallRow): Call {
  const appt = row.appointments?.[0];
  return {
    id: row.id,
    caller: row.caller_name?.trim() || "Unknown Caller",
    phone: row.caller_phone?.trim() || "Unknown",
    time: row.started_at,
    durationSec: row.duration_sec ?? 0,
    outcome: row.outcome,
    reason: row.reason?.trim() || "Call",
    summary: row.summary?.trim() || "",
    revenue: Number(row.revenue) || 0,
    appointment:
      appt && appt.scheduled_for
        ? {
            type: appt.type?.trim() || "Appointment",
            provider: appt.provider?.trim() || "Our team",
            when: formatAppointmentWhen(appt.scheduled_for),
          }
        : undefined,
    transcript: toTranscript(row.transcript),
    notes: row.notes?.trim() || undefined,
  };
}

/** Fetch a clinic's calls (newest first), mapped to the UI `Call` shape. */
export async function fetchCalls(
  supabase: SupabaseClient,
  clinicId: string,
  limit = 200
): Promise<Call[]> {
  const { data, error } = await supabase
    .from("calls")
    .select(CALL_SELECT)
    .eq("clinic_id", clinicId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as CallRow[] | null)?.map(mapCall) ?? [];
}

/** Fetch a single call by id (for the call-detail page). */
export async function fetchCall(
  supabase: SupabaseClient,
  clinicId: string,
  id: string
): Promise<Call | null> {
  const { data, error } = await supabase
    .from("calls")
    .select(CALL_SELECT)
    .eq("clinic_id", clinicId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCall(data as CallRow) : null;
}

/* -------------------------------------------------------------------------- */
/*  Derivations — build the dashboard's metrics/charts from a list of calls    */
/* -------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

/** A call counts as "after hours" if it landed on a weekend or outside 8am–5pm. */
function isAfterHours(iso: string): boolean {
  const d = new Date(iso);
  const day = d.getDay();
  const hour = d.getHours();
  return day === 0 || day === 6 || hour < 8 || hour >= 17;
}

/** Percent change from `prev` to `curr`, rounded. 0 when there's no baseline. */
function pctChange(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

/**
 * Build the four headline metric cards from real calls, comparing the last 30
 * days against the 30 days before that for the trend arrows.
 */
export function deriveMetrics(calls: Call[], now: Date = new Date()): Metric[] {
  const t = now.getTime();
  const inWindow = (c: Call, startAgoDays: number, endAgoDays: number) => {
    const time = new Date(c.time).getTime();
    return time <= t - startAgoDays * DAY_MS && time > t - endAgoDays * DAY_MS;
  };
  const curr = calls.filter((c) => inWindow(c, 0, 30));
  const prev = calls.filter((c) => inWindow(c, 30, 60));

  const bookedOf = (list: Call[]) => list.filter((c) => c.outcome === "booked");
  const revenueOf = (list: Call[]) =>
    list.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const afterHoursOf = (list: Call[]) =>
    list.filter((c) => isAfterHours(c.time)).length;

  const answered = curr.length;
  const booked = bookedOf(curr).length;
  const revenue = revenueOf(curr);
  const afterHours = afterHoursOf(curr);
  const conversion = answered > 0 ? Math.round((booked / answered) * 100) : 0;

  return [
    {
      label: "Calls Answered",
      value: answered.toLocaleString("en-US"),
      delta: pctChange(answered, prev.length),
      hint: "Last 30 days · 100% answer rate",
    },
    {
      label: "Appointments Booked",
      value: booked.toLocaleString("en-US"),
      delta: pctChange(booked, bookedOf(prev).length),
      hint: `${conversion}% of calls converted`,
    },
    {
      label: "Revenue Generated",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(revenue),
      delta: pctChange(revenue, revenueOf(prev)),
      hint: "Est. value from booked calls",
    },
    {
      label: "After-Hours Calls Saved",
      value: afterHours.toLocaleString("en-US"),
      delta: pctChange(afterHours, afterHoursOf(prev)),
      hint: "Calls handled outside office hours",
    },
  ];
}

/** Answered vs. booked per day for the trailing 14 days (chart series). */
export function deriveCallsOverTime(
  calls: Call[],
  now: Date = new Date()
): CallsOverTimePoint[] {
  const points: CallsOverTimePoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * DAY_MS);
    const label = day.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    points.push({ day: label, calls: 0, booked: 0 });
  }
  const indexByLabel = new Map(points.map((p, i) => [p.day, i]));
  const earliest = now.getTime() - 13 * DAY_MS;
  for (const c of calls) {
    const time = new Date(c.time).getTime();
    if (time < earliest - DAY_MS) continue;
    const label = new Date(c.time).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const idx = indexByLabel.get(label);
    if (idx == null) continue;
    points[idx].calls += 1;
    if (c.outcome === "booked") points[idx].booked += 1;
  }
  return points;
}

/** Revenue grouped by appointment type (booked calls only), highest first. */
export function deriveRevenueByType(calls: Call[]): RevenueByType[] {
  const totals = new Map<string, number>();
  for (const c of calls) {
    if (c.revenue <= 0) continue;
    const type = c.appointment?.type || c.reason || "Other";
    totals.set(type, (totals.get(type) ?? 0) + c.revenue);
  }
  return [...totals.entries()]
    .map(([type, value]) => ({ type, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}
