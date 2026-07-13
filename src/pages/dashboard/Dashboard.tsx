import { Link } from "react-router-dom";
import {
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  MoonStar,
  ArrowRight,
  Loader2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CallsChart } from "@/components/dashboard/CallsChart";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDemoView } from "@/context/DemoView";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useDashboardData } from "@/hooks/useDashboardData";
import { type Metric } from "@/data/mockData";
import { formatCurrency, timeAgo, initials } from "@/lib/utils";

const ICONS = [PhoneCall, CalendarCheck, TrendingUp, MoonStar];

export default function Dashboard() {
  useDocumentMeta({ title: "Dashboard", noindex: true });
  const { user } = useAuth();
  const { base } = useDemoView();
  const { loading, isDemo, error, calls, metrics, callsOverTime, revenueByType, totalRevenue, aiNumber } =
    useDashboardData();
  const firstName = user?.name?.split(" ")[0] ?? (isDemo ? "Dr. Patel" : "there");
  const recent = calls.slice(0, 5);
  const hasCalls = calls.length > 0;

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
              {isDemo
                ? "Here's what your AI receptionist did this month."
                : "Here's what your AI receptionist has been up to."}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to={`${base}/calls`}>
              View all calls
              <ArrowRight />
            </Link>
          </Button>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : (
          <>
            {!isDemo && !hasCalls && <FirstCallBanner aiNumber={aiNumber} />}

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
                    <CardDescription>
                      Answered vs. booked · last 14 days
                    </CardDescription>
                  </div>
                  <div className="hidden gap-4 sm:flex">
                    <Legend color="hsl(224 76% 40%)" label="Answered" />
                    <Legend color="hsl(160 84% 39%)" label="Booked" />
                  </div>
                </CardHeader>
                <div className="px-3 pb-4">
                  <CallsChart data={callsOverTime} />
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by service</CardTitle>
                  <CardDescription>
                    {formatCurrency(totalRevenue)} attributed{" "}
                    {isDemo ? "this month" : "so far"}
                  </CardDescription>
                </CardHeader>
                <div className="space-y-4 px-6 pb-6">
                  {revenueByType.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Revenue from booked calls will appear here.
                    </p>
                  ) : (
                    revenueByType.map((r) => {
                      const pct = totalRevenue
                        ? Math.round((r.value / totalRevenue) * 100)
                        : 0;
                      return (
                        <div key={r.type}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{r.type}</span>
                            <span className="font-semibold">
                              {formatCurrency(r.value)}
                            </span>
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
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Recent activity */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent calls</CardTitle>
                  <CardDescription>
                    Live activity from your AI receptionist
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`${base}/calls`}>See all</Link>
                </Button>
              </CardHeader>
              {hasCalls ? (
                <div className="divide-y divide-border border-t border-border">
                  {recent.map((call) => (
                    <Link
                      key={call.id}
                      to={`${base}/calls/${call.id}`}
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
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(call.time)}
                        </p>
                      </div>
                      <OutcomeBadge outcome={call.outcome} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 border-t border-border py-14 text-center">
                  <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                    <PhoneCall className="size-5" />
                  </span>
                  <p className="text-sm font-medium">No calls yet</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    The moment your AI receptionist answers a call, it shows up
                    here automatically.
                  </p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading your dashboard…
    </div>
  );
}

/** Distinct from the empty state — a real load failure, with a retry. */
function ErrorState() {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <div className="flex flex-col items-center gap-3 p-10">
        <span className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-5" />
        </span>
        <p className="text-sm font-semibold">We couldn't load your dashboard</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Something went wrong reaching your data — this is not the same as
          having no calls. Please try again.
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </Card>
  );
}

/** Shown to a real (non-demo) account that hasn't logged its first call yet.
 *  Only claims the receptionist is "ready" once a number is actually live. */
function FirstCallBanner({ aiNumber }: { aiNumber: string | null }) {
  const activated = Boolean(aiNumber);
  return (
    <Card className="border-primary/20 bg-primary/[0.04]">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {activated ? "Your receptionist is ready" : "Finish setting up your AI receptionist"}
            </p>
            <p className="text-sm text-muted-foreground">
              {activated ? (
                <>
                  Call your AI number{" "}
                  <span className="font-medium text-foreground">{aiNumber}</span> and
                  book a test appointment — it'll appear here within a few seconds
                  of hanging up.
                </>
              ) : (
                <>
                  Head to{" "}
                  <Link to="/dashboard/settings" className="font-medium text-primary hover:underline">
                    Settings
                  </Link>{" "}
                  to add your business details and activate your AI line.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </Card>
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
