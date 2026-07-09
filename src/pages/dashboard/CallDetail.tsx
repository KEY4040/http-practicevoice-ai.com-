import { useState } from "react";
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
  Send,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OutcomeBadge } from "@/components/OutcomeBadge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Call } from "@/data/mockData";
import { useCall } from "@/hooks/useDashboardData";
import { useDemoView } from "@/context/DemoView";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { loadClinicSettings } from "@/lib/clinicSettings";
import { renderTemplate } from "@/lib/smsTemplates";
import { sendSms, describeSmsResult, type SmsResult } from "@/lib/sms";
import { formatCurrency, formatDateTime, initials, cn } from "@/lib/utils";

function formatDuration(sec: number): string {
  if (!sec) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CallDetail() {
  const { id } = useParams<{ id: string }>();
  const { base } = useDemoView();
  const { loading, error, call } = useCall(id);
  useDocumentMeta({
    title: call ? `${call.caller} · Call detail` : "Call detail",
    noindex: true,
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading call…
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-md py-20 text-center">
          <h2 className="text-xl font-semibold">Couldn't load this call</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong reaching your data. Please try again.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button asChild>
              <Link to={`${base}/calls`}>Back to call history</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!call) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-md py-20 text-center">
          <h2 className="text-xl font-semibold">Call not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This call may have been removed.
          </p>
          <Button asChild className="mt-6">
            <Link to={`${base}/calls`}>Back to call history</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          to={`${base}/calls`}
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
                  <SmsActions call={call} />
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

/**
 * Confirmation / reminder text actions for a booked call. Renders the clinic's
 * saved template with this call's details and sends via the SMS helper (which
 * hits the Twilio Netlify Function; simulates in demo/preview).
 */
function SmsActions({ call }: { call: Call }) {
  const [pending, setPending] = useState<"confirmation" | "reminder" | null>(null);
  const [result, setResult] = useState<SmsResult | null>(null);

  async function send(kind: "confirmation" | "reminder") {
    if (!call.appointment) return;
    const settings = loadClinicSettings();
    const template =
      kind === "confirmation"
        ? settings.confirmationTemplate
        : settings.reminderTemplate;
    const body = renderTemplate(template, {
      patient_name: call.caller,
      clinic_name: settings.clinicName,
      service: call.appointment.type,
      appointment_time: call.appointment.when,
      provider: call.appointment.provider,
    });
    setPending(kind);
    setResult(null);
    const res = await sendSms(call.phone, body);
    setPending(null);
    setResult(res);
  }

  return (
    <div className="mt-5 border-t border-accent/20 pt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending !== null}
          onClick={() => send("confirmation")}
        >
          {pending === "confirmation" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send />
          )}
          Resend confirmation
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending !== null}
          onClick={() => send("reminder")}
        >
          {pending === "reminder" ? <Loader2 className="animate-spin" /> : <Send />}
          Send reminder
        </Button>
      </div>
      {result && (
        <p
          className={cn(
            "mt-2.5 text-xs",
            result.status === "sent"
              ? "text-accent-hover"
              : result.status === "error"
                ? "text-destructive"
                : "text-muted-foreground"
          )}
        >
          {describeSmsResult(result)} · to {call.phone}
        </p>
      )}
    </div>
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
