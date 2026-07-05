import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Clock,
  CalendarCheck,
  Play,
  StickyNote,
  User,
  DollarSign,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCallById } from "@/data/mockData";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { formatCurrency, formatDateTime, initials, cn } from "@/lib/utils";

function formatDuration(sec: number): string {
  if (!sec) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CallDetail() {
  const { id } = useParams<{ id: string }>();
  const call = id ? getCallById(id) : undefined;
  useDocumentMeta({
    title: call ? `${call.caller} · Call detail` : "Call detail",
    noindex: true,
  });

  if (!call) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-md py-20 text-center">
          <h2 className="text-xl font-semibold">Call not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This call may have been removed.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard/calls">Back to call history</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          to="/dashboard/calls"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to call history
        </Link>

        {/* Header */}
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {call.caller === "Unknown Caller" ? "?" : initials(call.caller)}
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight">{call.caller}</h1>
                <p className="text-sm text-muted-foreground">{call.phone}</p>
              </div>
            </div>
            <OutcomeBadge outcome={call.outcome} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
            <Stat Icon={Clock} label="Date & time" value={formatDateTime(call.time)} />
            <Stat Icon={Phone} label="Duration" value={formatDuration(call.durationSec)} />
            <Stat Icon={User} label="Reason" value={call.reason} />
            <Stat
              Icon={DollarSign}
              label="Revenue"
              value={call.revenue > 0 ? formatCurrency(call.revenue) : "—"}
              accent={call.revenue > 0}
            />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Transcript */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Transcript</CardTitle>
                <Button variant="outline" size="sm" disabled title="Recording playback coming soon">
                  <Play className="size-4" />
                  Play recording
                </Button>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                {call.transcript.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      line.speaker === "caller" && "flex-row-reverse"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
                        line.speaker === "ai"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {line.speaker === "ai" ? "AI" : "•"}
                    </span>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-soft",
                        line.speaker === "ai"
                          ? "rounded-tl-sm bg-primary text-primary-foreground"
                          : "rounded-tr-sm bg-muted text-foreground"
                      )}
                    >
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar: summary / appointment / notes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI summary</CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {call.summary}
                </p>
              </div>
            </Card>

            {call.appointment && (
              <Card className="border-accent/30 bg-accent/[0.04]">
                <div className="p-6">
                  <div className="flex items-center gap-2 text-accent-hover">
                    <CalendarCheck className="size-4" />
                    <span className="text-sm font-semibold">Appointment booked</span>
                  </div>
                  <dl className="mt-4 space-y-2.5 text-sm">
                    <Row label="Type" value={call.appointment.type} />
                    <Row label="Provider" value={call.appointment.provider} />
                    <Row label="When" value={call.appointment.when} />
                  </dl>
                </div>
              </Card>
            )}

            {call.notes && (
              <Card>
                <CardHeader className="flex-row items-center gap-2">
                  <StickyNote className="size-4 text-muted-foreground" />
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {call.notes}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({
  Icon,
  label,
  value,
  accent = false,
}: {
  Icon: typeof Clock;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className={cn("mt-1 text-sm font-semibold", accent && "text-accent-hover")}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
