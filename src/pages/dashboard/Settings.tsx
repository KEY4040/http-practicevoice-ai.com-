import { useState, type FormEvent } from "react";
import {
  Building2,
  Phone,
  Clock,
  Stethoscope,
  Calendar,
  Check,
  Plus,
  X,
  Mic,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { cn } from "@/lib/utils";

const DEFAULT_SERVICES = [
  "Cleaning & Exam",
  "Crown / Restorative",
  "Emergency Visit",
  "Whitening",
  "Consultation",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Settings() {
  useDocumentMeta({ title: "Clinic Setup", noindex: true });
  const [clinicName, setClinicName] = useState("Bayview Dental");
  const [phone, setPhone] = useState("(415) 555-0100");
  const [services, setServices] = useState<string[]>(DEFAULT_SERVICES);
  const [newService, setNewService] = useState("");
  const [openDays, setOpenDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [voice, setVoice] = useState("Ava");
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [saved, setSaved] = useState(false);

  function addService() {
    const s = newService.trim();
    if (s && !services.includes(s)) {
      setServices((prev) => [...prev, s]);
      setNewService("");
    }
  }

  function toggleDay(day: string) {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    // In production this would persist to Supabase. For the demo we flash a
    // success state.
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <DashboardLayout>
      <form onSubmit={onSave} className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinic Setup</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell your AI receptionist about your practice. This takes under 5
            minutes.
          </p>
        </div>

        {/* Calendar connect — the hero action */}
        <Card
          className={cn(
            "p-6 transition-colors",
            calendarConnected
              ? "border-accent/40 bg-accent/[0.04]"
              : "border-primary/25 bg-primary/[0.03]"
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-xl",
                  calendarConnected ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                )}
              >
                <Calendar className="size-6" />
              </span>
              <div>
                <p className="font-semibold">
                  {calendarConnected ? "Google Calendar connected" : "Connect Google Calendar"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {calendarConnected
                    ? "Bookings sync automatically to your calendar."
                    : "One click to let the AI book into real open slots."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant={calendarConnected ? "outline" : "primary"}
              onClick={() => setCalendarConnected((v) => !v)}
            >
              {calendarConnected ? (
                <>
                  <Check className="size-4" />
                  Connected
                </>
              ) : (
                "Connect Google Calendar"
              )}
            </Button>
          </div>
        </Card>

        {/* Practice details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              Practice details
            </CardTitle>
            <CardDescription>The basics your receptionist introduces.</CardDescription>
          </CardHeader>
          <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clinic">Clinic name</Label>
              <Input
                id="clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. Bayview Dental"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Practice phone number</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                  placeholder="(415) 555-0100"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-4 text-primary" />
              Services offered
            </CardTitle>
            <CardDescription>
              The AI uses these to understand and book requests.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setServices((prev) => prev.filter((x) => x !== s))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                aria-label="Add a service"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addService();
                  }
                }}
                placeholder="Add a service…"
                className="max-w-xs"
              />
              <Button type="button" variant="outline" onClick={addService}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Office hours
            </CardTitle>
            <CardDescription>
              The AI answers 24/7 and books within these hours.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={openDays.includes(day)}
                  aria-label={day}
                  className={cn(
                    "size-11 rounded-xl text-sm font-semibold transition-colors",
                    openDays.includes(day)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="open">Opens</Label>
                <Input
                  id="open"
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-36"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="close">Closes</Label>
                <Input
                  id="close"
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-36"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Voice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="size-4 text-primary" />
              Receptionist voice
            </CardTitle>
            <CardDescription>Choose the tone that fits your practice.</CardDescription>
          </CardHeader>
          <fieldset className="px-6 pb-6">
            <legend className="sr-only">Receptionist voice</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Ava", desc: "Warm & friendly" },
                { name: "Grace", desc: "Calm & professional" },
                { name: "Noah", desc: "Confident & clear" },
              ].map((v) => {
                const selected = voice === v.name;
                return (
                  <label
                    key={v.name}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                      selected
                        ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="voice"
                      value={v.name}
                      checked={selected}
                      onChange={() => setVoice(v.name)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{v.name}</span>
                      {selected && <Badge variant="primary">Selected</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{v.desc}</p>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </Card>

        {/* Sticky save bar */}
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/90 p-4 shadow-elevated backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-accent-hover">
                <Check className="size-4" />
                Settings saved
              </span>
            ) : (
              "Changes apply to your AI receptionist instantly."
            )}
          </p>
          <Button type="submit" size="lg">
            Save settings
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
