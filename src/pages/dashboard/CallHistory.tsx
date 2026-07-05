import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Phone, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calls, type CallOutcome } from "@/data/mockData";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { formatCurrency, formatDateTime, initials, cn } from "@/lib/utils";

const FILTERS: { label: string; value: CallOutcome | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Booked", value: "booked" },
  { label: "Escalated", value: "escalated" },
  { label: "Info", value: "info" },
  { label: "Missed", value: "missed" },
];

function formatDuration(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CallHistory() {
  useDocumentMeta({ title: "Call History", noindex: true });
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CallOutcome | "all">("all");

  const filtered = useMemo(() => {
    return calls.filter((c) => {
      const matchesFilter = filter === "all" || c.outcome === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        c.caller.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q) ||
        c.phone.includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Call History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every call your AI receptionist handled, with summaries and outcomes.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search calls by caller, reason, or number"
              placeholder="Search caller, reason, number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={cn(
                  "min-h-[38px] rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <Card className="hidden overflow-hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Caller</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3 text-right">Revenue</th>
                <th className="px-6 py-3">Outcome</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((call) => (
                <tr
                  key={call.id}
                  onClick={() => navigate(`/dashboard/calls/${call.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-muted/40"
                >
                  <td className="px-6 py-4">
                    {/* The row itself navigates on click; this link is the
                        keyboard-accessible focus target for the row. */}
                    <Link
                      to={`/dashboard/calls/${call.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {call.caller === "Unknown Caller" ? "?" : initials(call.caller)}
                      </span>
                      <span>
                        <span className="block font-medium text-foreground">
                          {call.caller}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {call.phone}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDateTime(call.time)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{call.reason}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDuration(call.durationSec)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-accent-hover">
                    {call.revenue > 0 ? formatCurrency(call.revenue) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <OutcomeBadge outcome={call.outcome} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors group-hover:bg-background group-hover:text-foreground">
                      <ChevronRight className="size-4" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState />}
        </Card>

        {/* Mobile list */}
        <div className="space-y-3 md:hidden">
          {filtered.map((call) => (
            <Link key={call.id} to={`/dashboard/calls/${call.id}`}>
              <Card className="flex items-center gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {call.caller === "Unknown Caller" ? "?" : initials(call.caller)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{call.caller}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {call.reason} · {formatDateTime(call.time)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <OutcomeBadge outcome={call.outcome} />
                  {call.revenue > 0 && (
                    <span className="text-xs font-semibold text-accent-hover">
                      {formatCurrency(call.revenue)}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <Card>
              <EmptyState />
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Phone className="size-5" />
      </span>
      <p className="text-sm font-medium">No calls match your search</p>
      <p className="text-xs text-muted-foreground">
        Try a different keyword or filter.
      </p>
    </div>
  );
}
