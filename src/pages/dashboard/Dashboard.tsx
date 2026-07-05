import { Link } from "react-router-dom";
import {
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  MoonStar,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CallsChart } from "@/components/dashboard/CallsChart";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  metrics,
  calls,
  revenueByType,
  type Metric,
} from "@/data/mockData";
import { formatCurrency, timeAgo, initials } from "@/lib/utils";

const ICONS = [PhoneCall, CalendarCheck, TrendingUp, MoonStar];

export default function Dashboard() {
  useDocumentMeta({ title: "Dashboard", noindex: true });
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const recent = calls.slice(0, 5);
  const totalRevenue = revenueByType.reduce((sum, r) => sum + r.value, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Greeting */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Good to see you, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what your AI receptionist did this month.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard/calls">
              View all calls
              <ArrowRight />
            </Link>
          </Button>
        </div>

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m: Metric, i) => (
            <MetricCard
              key={m.label}
              label={m.label}
              value={m.value}
              delta={m.delta}
              hint={m.hint}
              Icon={ICONS[i]}
              highlight={m.label === "Revenue Generated"}
            />
          ))}
        </div>

        {/* Chart + revenue breakdown */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Calls over time</CardTitle>
                <CardDescription>Answered vs. booked · last 14 days</CardDescription>
              </div>
              <div className="hidden gap-4 sm:flex">
                <Legend color="hsl(224 76% 40%)" label="Answered" />
                <Legend color="hsl(160 84% 39%)" label="Booked" />
              </div>
            </CardHeader>
            <div className="px-3 pb-4">
              <CallsChart />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by service</CardTitle>
              <CardDescription>
                {formatCurrency(totalRevenue)} attributed this month
              </CardDescription>
            </CardHeader>
            <div className="space-y-4 px-6 pb-6">
              {revenueByType.map((r) => {
                const pct = Math.round((r.value / totalRevenue) * 100);
                return (
                  <div key={r.type}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{r.type}</span>
                      <span className="font-semibold">{formatCurrency(r.value)}</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${r.type}: ${formatCurrency(r.value)}, ${pct}% of revenue`}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent calls</CardTitle>
              <CardDescription>Live activity from your AI receptionist</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/calls">See all</Link>
            </Button>
          </CardHeader>
          <div className="divide-y divide-border border-t border-border">
            {recent.map((call) => (
              <Link
                key={call.id}
                to={`/dashboard/calls/${call.id}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {call.caller === "Unknown Caller" ? "?" : initials(call.caller)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{call.caller}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {call.reason}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-accent-hover">
                    {call.revenue > 0 ? formatCurrency(call.revenue) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{timeAgo(call.time)}</p>
                </div>
                <OutcomeBadge outcome={call.outcome} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
