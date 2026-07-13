import { useEffect, useState, type FormEvent } from "react";
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
  MessageSquareText,
  Send,
  Loader2,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { loadClinicSettings, saveClinicSettings } from "@/lib/clinicSettings";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { getOrCreateClinic, updateClinicProfile } from "@/lib/clinic";
import { SMS_VARIABLES, renderTemplate, sampleVars } from "@/lib/smsTemplates";
import { sendSms, describeSmsResult, type SmsResult } from "@/lib/sms";
import { activateAiLine, type ActivateResult } from "@/lib/provision";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Settings() {
  useDocumentMeta({ title: "Clinic Setup", noindex: true });
  // Read persisted settings once so everything the owner set sticks between visits.
  const [loaded] = useState(loadClinicSettings);
  const [clinicName, setClinicName] = useState(loaded.clinicName);
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<string[]>(loaded.services);
  const [newService, setNewService] = useState("");
  const [openDays, setOpenDays] = useState<string[]>(loaded.openDays);
  const [openTime, setOpenTime] = useState(loaded.openTime);
  const [closeTime, setCloseTime] = useState(loaded.closeTime);
  const [voice, setVoice] = useState(loaded.voice);
  const [twilioNumber, setTwilioNumber] = useState(loaded.twilioNumber);
  const [confirmationTemplate, setConfirmationTemplate] = useState(
    loaded.confirmationTemplate
  );
  const [reminderTemplate, setReminderTemplate] = useState(loaded.reminderTemplate);
  const [about, setAbout] = useState(loaded.about);
  const [saved, setSaved] = useState(false);

  // AI line activation state.
  const [aiNumber, setAiNumber] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateResult, setActivateResult] = useState<ActivateResult | null>(null);

  // On a real (Supabase-connected) account, load the clinic's saved name/phone
  // so the form reflects reality — and so saving never clobbers them with
  // placeholder values.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) return;
        const clinic = await getOrCreateClinic(supabase);
        if (!active || !clinic) return;
        if (clinic.name && clinic.name !== "My Practice") setClinicName(clinic.name);
        if (clinic.phone) setPhone(clinic.phone);
        if (clinic.about) setAbout(clinic.about);
        if (clinic.retell_number) setAiNumber(clinic.retell_number);
      } catch {
        /* non-fatal — keep local defaults */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onActivate() {
    setActivating(true);
    setActivateResult(null);
    // Make sure the latest settings are saved before the AI is built from them.
    await persist();
    const result = await activateAiLine();
    if (result.number) setAiNumber(result.number);
    setActivateResult(result);
    setActivating(false);
  }

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

  /** Save everything: on-device (templates) + the clinic profile in Supabase
   *  (name, phone, services, hours, voice, about) so the AI is built from real
   *  values. Returns a promise so callers can await before provisioning. */
  function persist(): Promise<void> {
    saveClinicSettings({
      clinicName,
      twilioNumber,
      confirmationTemplate,
      reminderTemplate,
      services,
      openDays,
      openTime,
      closeTime,
      voice,
      about,
    });
    if (!isSupabaseConfigured) return Promise.resolve();
    return getSupabase()
      .then((supabase) => {
        if (supabase)
          return updateClinicProfile(supabase, {
            name: clinicName,
            phone: phone.trim() || undefined,
            about,
            services,
            openDays,
            openTime,
            closeTime,
            voice,
          });
      })
      .catch(() => {
        /* non-fatal — settings still saved locally */
      });
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    void persist();
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

        {/* Activate the AI line — provisions the customer's own Retell agent + number */}
        <Card
          className={cn(
            "p-6",
            aiNumber
              ? "border-accent/30 bg-accent/[0.05]"
              : "border-primary/30 bg-primary/[0.04]"
          )}
        >
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-xl",
                aiNumber ? "bg-accent/15 text-accent-hover" : "bg-primary/10 text-primary"
              )}
            >
              <PhoneCall className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              {aiNumber ? (
                <>
                  <p className="font-semibold">Your AI line is live ✅</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Forward your business line to your AI number and every call
                    is answered.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-sm font-semibold">
                      {aiNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ← forward your calls here
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold">Activate your AI receptionist</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fill in your details below, then activate. We build your AI
                    and give you a number to forward your business line to.
                  </p>
                </>
              )}

              <div className="mt-4">
                <Button
                  type="button"
                  onClick={onActivate}
                  disabled={activating}
                  variant={aiNumber ? "outline" : "primary"}
                >
                  {activating ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {aiNumber ? "Re-sync my AI with these settings" : "Activate my AI line"}
                </Button>
              </div>

              {activateResult && activateResult.status === "error" && (
                <p className="mt-2.5 text-xs text-destructive">
                  {activateResult.message}
                </p>
              )}
              {activateResult && activateResult.status === "demo" && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Activation runs on the live site once RETELL_API_KEY is set in
                  Netlify.
                </p>
              )}
              {activateResult &&
                (activateResult.status === "created" ||
                  activateResult.status === "updated") &&
                activateResult.message && (
                  <p className="mt-2.5 text-xs text-warning-foreground">
                    {activateResult.message}
                  </p>
                )}
            </div>
          </div>
        </Card>

        {/* Calendar connect — coming soon (not yet available; shown honestly) */}
        <Card className="border-border bg-muted/30 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Calendar className="size-6" />
              </span>
              <div>
                <p className="font-semibold">Google Calendar sync</p>
                <p className="text-sm text-muted-foreground">
                  Two-way calendar sync is coming soon. For now, Ava books using
                  the hours and services you set below.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" disabled>
              Coming soon
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="about">Tell your AI about your business</Label>
              <Textarea
                id="about"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                placeholder="What you do, what you sell, prices, common questions, anything the AI should know when it answers. Example: We sell rubber feet, grommets, and washers. Free shipping over $50. Minimum order 20 pieces."
              />
              <p className="text-xs text-muted-foreground">
                The more you tell it, the better it answers. This becomes your
                AI's script.
              </p>
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

        {/* Text messages (SMS) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-primary" />
              Text messages (SMS)
            </CardTitle>
            <CardDescription>
              Confirmations and reminders sent to patients after they book.
            </CardDescription>
          </CardHeader>
          <div className="space-y-6 px-6 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="twilio">Your Twilio phone number</Label>
              <div className="relative max-w-xs">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="twilio"
                  value={twilioNumber}
                  onChange={(e) => setTwilioNumber(e.target.value)}
                  className="pl-9"
                  placeholder="+1 (415) 555-0199"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The number texts are sent from. Connect it in Netlify with your
                Twilio keys to start sending.
              </p>
            </div>

            <SendTestText />

            {/* Available variables */}
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs font-medium text-foreground">
                Insert these — they fill in automatically:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SMS_VARIABLES.map((v) => (
                  <code
                    key={v.token}
                    title={v.label}
                    className="rounded-md bg-background px-1.5 py-0.5 text-xs text-primary shadow-soft"
                  >
                    {v.token}
                  </code>
                ))}
              </div>
            </div>

            <SmsTemplateField
              id="confirmation"
              label="Confirmation text"
              hint="Sent right after the AI books an appointment."
              value={confirmationTemplate}
              onChange={setConfirmationTemplate}
              clinicName={clinicName}
            />
            <SmsTemplateField
              id="reminder"
              label="Reminder text"
              hint="Sent automatically ~24 hours before the appointment."
              value={reminderTemplate}
              onChange={setReminderTemplate}
              clinicName={clinicName}
            />
          </div>
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

/** Normalize a typed US phone number to E.164 (e.g. "+14788341308"). */
function toE164(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return trimmed;
}

/**
 * Lets the owner send a real test text to their own phone to confirm Twilio is
 * working — no fake data, no dev tools. Uses the same send path as everything
 * else (the send-sms Netlify Function).
 */
function SendTestText() {
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SmsResult | null>(null);

  async function send() {
    if (!to.trim()) return;
    setSending(true);
    setResult(null);
    const res = await sendSms(
      toE164(to),
      "✅ Test from PracticeVoice AI — your text messaging is working!"
    );
    setSending(false);
    setResult(res);
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium">Send a test text</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Text your own phone to confirm Twilio is set up correctly.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="tel"
          aria-label="Your phone number for a test text"
          placeholder="Your cell, e.g. (762) 555-0100"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button type="button" onClick={send} disabled={sending || !to.trim()}>
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
          Send test
        </Button>
      </div>
      {result && (
        <p
          className={cn(
            "mt-2.5 text-xs",
            result.status === "sent"
              ? "font-medium text-accent-hover"
              : result.status === "error"
                ? "text-destructive"
                : "text-muted-foreground"
          )}
        >
          {result.status === "sent"
            ? `Sent ✓ Check ${toE164(to)} for the text.`
            : describeSmsResult(result)}
        </p>
      )}
    </div>
  );
}

/** A template editor with a live "how it'll read" preview bubble. */
function SmsTemplateField({
  id,
  label,
  hint,
  value,
  onChange,
  clinicName,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  clinicName: string;
}) {
  const preview = renderTemplate(value, sampleVars(clinicName));
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
      <div className="mt-2">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Preview</p>
        <div className="max-w-sm rounded-2xl rounded-bl-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground shadow-soft">
          {preview}
        </div>
      </div>
    </div>
  );
}
