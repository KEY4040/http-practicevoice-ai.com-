import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
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
  Mail,
  MessageSquareText,
  Send,
  Loader2,
  PhoneCall,
  Sparkles,
  Star,
  ExternalLink,
  KeyRound,
  Globe,
  CheckCircle2,
  CalendarCheck,
  Pencil,
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
import {
  getOrCreateClinic,
  updateClinicProfile,
  updateVipSettings,
  updateCalendarSettings,
} from "@/lib/clinic";
import { SMS_VARIABLES, renderTemplate, sampleVars } from "@/lib/smsTemplates";
import { sendSms, describeSmsResult, type SmsResult } from "@/lib/sms";
import { sendTestEmail, type TestEmailResult } from "@/lib/testEmail";
import { generateScript } from "@/lib/generateScript";
import { activateAiLine, type ActivateResult } from "@/lib/provision";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Settings() {
  useDocumentMeta({ title: "Clinic Setup", noindex: true });
  // The owner's account email — where booking alerts are sent automatically.
  const { user } = useAuth();
  const userEmail = user?.email ?? null;
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
  // "Instant AI Receptionist" generator: industry input + progress/error state.
  // Industry is a generation input only (not persisted) — the drafted script it
  // produces is what gets saved (into `about`).
  const [industry, setIndustry] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  // Optional override for where booking alerts are emailed. Blank = use the
  // account email (userEmail). Lets a customer whose signup email is personal
  // point alerts at a professional inbox.
  const [alertEmail, setAlertEmail] = useState("");

  // VIP Passthrough: numbers that ring straight through to the owner's cell.
  const [vipEnabled, setVipEnabled] = useState(false);
  const [vipTransferTo, setVipTransferTo] = useState("");
  const [vipNumbers, setVipNumbers] = useState<string[]>([]);
  const [newVip, setNewVip] = useState("");

  // Calendar booking (Cal.com): the AI books real appointments into the owner's
  // own calendar. They paste their Cal.com API key + event-type id + timezone.
  const [calApiKey, setCalApiKey] = useState("");
  const [calEventTypeId, setCalEventTypeId] = useState("");
  const [calTimezone, setCalTimezone] = useState("");
  // Whether a calendar is already connected in the DB. The API key itself is
  // never sent to the browser (it's a secret), so we track connection state
  // separately and leave the key field blank unless the owner is changing it.
  const [calConnected, setCalConnected] = useState(false);

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
        // Hydrate the rest from the DB (source of truth) so settings survive a
        // new device / cleared cache instead of snapping back to defaults.
        if (clinic.services && clinic.services.length) setServices(clinic.services);
        if (clinic.open_days && clinic.open_days.length) setOpenDays(clinic.open_days);
        if (clinic.open_time) setOpenTime(clinic.open_time.slice(0, 5));
        if (clinic.close_time) setCloseTime(clinic.close_time.slice(0, 5));
        if (clinic.voice) setVoice(clinic.voice);
        if (clinic.retell_number) setAiNumber(clinic.retell_number);
        if (clinic.alert_email) setAlertEmail(clinic.alert_email);
        if (typeof clinic.vip_enabled === "boolean") setVipEnabled(clinic.vip_enabled);
        if (clinic.vip_transfer_to) setVipTransferTo(clinic.vip_transfer_to);
        if (clinic.vip_numbers && clinic.vip_numbers.length) setVipNumbers(clinic.vip_numbers);
        // The key is never fetched to the browser; connection state comes from
        // calendar_provider. The field stays blank until the owner enters a new key.
        setCalConnected(Boolean(clinic.calendar_provider));
        if (clinic.cal_event_type_id) setCalEventTypeId(String(clinic.cal_event_type_id));
        if (clinic.cal_timezone) setCalTimezone(clinic.cal_timezone);
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

  async function onGenerate() {
    setGenError(null);
    const name = clinicName.trim();
    const ind = industry.trim();
    if (!name || !ind) {
      setGenError("Add your business name and industry first.");
      return;
    }
    setGenerating(true);
    const r = await generateScript(name, ind);
    setGenerating(false);
    if (r.status === "ok" && r.script) {
      setAbout(r.script);
    } else if (r.status === "missing") {
      setGenError(r.message ?? "Add your business name and industry first.");
    } else if (r.status === "not_configured") {
      setGenError("The script writer is being set up — please try again shortly.");
    } else if (r.status === "demo") {
      setGenError("This will work once the site finishes deploying.");
    } else {
      setGenError(r.message ?? "Couldn't write your script just now — please try again.");
    }
  }

  function addService() {
    const s = newService.trim();
    if (s && !services.includes(s)) {
      setServices((prev) => [...prev, s]);
      setNewService("");
    }
  }

  function addVip() {
    const digits = newVip.replace(/\D/g, "");
    const last10 = digits.slice(-10);
    if (
      last10.length === 10 &&
      !vipNumbers.some((n) => n.replace(/\D/g, "").slice(-10) === last10)
    ) {
      setVipNumbers((prev) => [...prev, newVip.trim()]);
      setNewVip("");
    }
  }

  function removeVip(n: string) {
    setVipNumbers((prev) => prev.filter((x) => x !== n));
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
            alertEmail,
          })
            .then(() =>
              updateVipSettings(supabase, {
                enabled: vipEnabled,
                transferTo: vipTransferTo,
                numbers: vipNumbers,
              })
            )
            .then(() =>
              updateCalendarSettings(supabase, {
                // Only send the key when the owner actually typed one — a blank
                // field means "unchanged", so we must NOT clear the stored key.
                apiKey: calApiKey.trim() ? calApiKey : undefined,
                eventTypeId: calEventTypeId.replace(/\D/g, "")
                  ? Number(calEventTypeId.replace(/\D/g, ""))
                  : null,
                timezone: calTimezone,
              })
            );
      })
      .catch(() => {
        /* non-fatal — settings still saved locally */
      });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    // One clear action: save the settings, and if the AI line is already live,
    // push those changes to the AI too (re-sync) — so there's no separate
    // "Re-sync" button to think about. First-time activation stays its own button.
    if (aiNumber) {
      await onActivate();
    } else {
      await persist();
    }
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

              {/* First-time activation only. Once the line is live, there's no
                  separate re-sync button — "Save settings" (bottom bar) saves AND
                  pushes the changes to the AI, so there's one clear action. */}
              {!aiNumber && (
                <div className="mt-4">
                  <Button type="button" onClick={onActivate} disabled={activating} variant="primary">
                    {activating ? <Loader2 className="animate-spin" /> : <Sparkles className="size-4" />}
                    Activate my AI line
                  </Button>
                </div>
              )}

              {activateResult && activateResult.status === "needs_card" && (
                <p className="mt-2.5 text-xs text-foreground">
                  {activateResult.message}{" "}
                  <Link to="/billing" className="font-semibold text-primary hover:underline">
                    Add a card →
                  </Link>
                </p>
              )}
              {activateResult && activateResult.status === "error" && (
                <p className="mt-2.5 text-xs text-destructive">
                  {activateResult.message}
                </p>
              )}
              {activateResult && activateResult.status === "demo" && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Activation is temporarily unavailable — please try again shortly.
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

              {/* Instant generator — writes a first draft from name + industry. */}
              <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.05] to-accent/[0.04] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="industry" className="text-xs font-medium">
                      Your industry
                    </Label>
                    <Input
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void onGenerate();
                        }
                      }}
                      placeholder="e.g. Dental, HVAC, Law firm, Salon"
                      className="bg-background"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={onGenerate}
                    disabled={generating || !clinicName.trim() || !industry.trim()}
                    className="shrink-0"
                  >
                    {generating ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    Instant AI Receptionist
                  </Button>
                </div>
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Enter your business name (above) and industry — we'll write your
                  AI's script in seconds. Edit it however you like afterward.
                </p>
                {genError && (
                  <p className="mt-2 text-xs text-destructive">{genError}</p>
                )}
              </div>

              <Textarea
                id="about"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={12}
                className="min-h-[16rem]"
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
              <Label htmlFor="twilio">Your text-message number</Label>
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
                The number your patients' confirmations and reminders are sent
                from.
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

        {/* Email alerts — every booking is emailed to the owner automatically. */}
        <Card className="p-6">
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Mail className="size-5" />
              </span>
              <CardTitle>Email alerts</CardTitle>
              <Badge variant="success">On</Badge>
            </div>
            <CardDescription className="mt-2">
              Every appointment your AI books is emailed to you the moment it
              happens — no setup needed.
            </CardDescription>
          </CardHeader>

          <div className="mt-6 space-y-1.5">
            <Label htmlFor="alert-email">Send alerts to</Label>
            <div className="relative max-w-md">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="alert-email"
                type="email"
                autoComplete="off"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="pl-9"
                placeholder={userEmail || "you@yourbusiness.com"}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to use your account email
              {userEmail ? (
                <>
                  {" "}
                  (<strong>{userEmail}</strong>)
                </>
              ) : null}
              . Prefer a front-desk or business inbox? Enter it here.
            </p>
          </div>

          <div className="mt-6">
            <SendTestEmail email={alertEmail.trim() || userEmail} />
          </div>
        </Card>

        {/* VIP Passthrough */}
        <Card className="p-6">
          <CardHeader className="p-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Star className="size-5" />
              </span>
              <CardTitle>VIP Passthrough</CardTitle>
              <Badge variant="primary">Ring straight to you</Badge>
            </div>
            <CardDescription className="mt-2">
              Numbers on this list ring <strong>straight through to your cell</strong> —
              the AI never picks up for them. Everyone else still gets your AI
              receptionist. Perfect if you run your business from your phone.
            </CardDescription>
          </CardHeader>

          <div className="mt-6 space-y-5">
            {/* Master switch */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={vipEnabled}
                onChange={(e) => setVipEnabled(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span className="text-sm font-medium">Turn on VIP Passthrough</span>
            </label>

            {/* Cell to ring */}
            <div className="space-y-1.5">
              <Label htmlFor="vip-cell">Ring my cell</Label>
              <p className="text-xs text-muted-foreground">
                Where VIP calls get sent. Use your number in +1 format.
              </p>
              <Input
                id="vip-cell"
                type="tel"
                value={vipTransferTo}
                onChange={(e) => setVipTransferTo(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>

            {/* Add numbers, one at a time */}
            <div className="space-y-1.5">
              <Label htmlFor="vip-add">VIP numbers</Label>
              <p className="text-xs text-muted-foreground">
                Add the people who should always reach you directly — one at a time.
              </p>
              <div className="flex gap-2">
                <Input
                  id="vip-add"
                  type="tel"
                  value={newVip}
                  onChange={(e) => setNewVip(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addVip();
                    }
                  }}
                  placeholder="(555) 123-4567"
                />
                <Button type="button" variant="outline" onClick={addVip}>
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              {vipNumbers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {vipNumbers.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 py-1 pl-3 pr-1.5 text-sm"
                    >
                      {n}
                      <button
                        type="button"
                        onClick={() => removeVip(n)}
                        aria-label={`Remove ${n}`}
                        className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Calendar booking (Cal.com) — premium guided walkthrough */}
        <CalendarConnect
          calConnected={calConnected}
          calApiKey={calApiKey}
          setCalApiKey={setCalApiKey}
          calEventTypeId={calEventTypeId}
          setCalEventTypeId={setCalEventTypeId}
          calTimezone={calTimezone}
          setCalTimezone={setCalTimezone}
        />

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
          <Button type="submit" size="lg" disabled={activating}>
            {activating && <Loader2 className="animate-spin" />}
            {activating ? "Saving…" : "Save settings"}
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
        Text your own phone to confirm your text messaging is set up correctly.
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

/**
 * "Send a test email" button — POSTs to the send-test-email Function, which mails
 * a sample booking alert to the owner's own account inbox so they can confirm
 * alerts arrive. Recipient is resolved server-side (never sent from the client).
 */
function SendTestEmail({ email }: { email: string | null }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TestEmailResult | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    const r = await sendTestEmail();
    setSending(false);
    setResult(r);
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium">Send a test email</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Send a sample booking alert to {email || "your inbox"} to confirm it
        arrives (check spam too).
      </p>
      <div className="mt-3">
        <Button type="button" onClick={send} disabled={sending}>
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
          Send test email
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
            ? `Sent ✓ Check ${result.to || "your inbox"} (and spam).`
            : result.status === "not_configured"
              ? "Add your Resend key in Netlify to send for real."
              : result.status === "demo"
                ? "Demo — email would send once deployed."
                : result.message ?? "Could not send"}
        </p>
      )}
    </div>
  );
}

/**
 * CalendarConnect — a premium, guided walkthrough for connecting a Cal.com
 * calendar so the AI books real appointments. Instead of raw "API key" fields,
 * it presents a numbered stepper (create account → paste key → pick the
 * appointment → confirm timezone) that lights up green as each step is done, and
 * collapses into a clean "connected" summary once set. The underlying values are
 * the same three fields the backend expects — this is pure presentation.
 */
function CalendarConnect({
  calConnected,
  calApiKey,
  setCalApiKey,
  calEventTypeId,
  setCalEventTypeId,
  calTimezone,
  setCalTimezone,
}: {
  calConnected: boolean;
  calApiKey: string;
  setCalApiKey: (v: string) => void;
  calEventTypeId: string;
  setCalEventTypeId: (v: string) => void;
  calTimezone: string;
  setCalTimezone: (v: string) => void;
}) {
  const [accountOpened, setAccountOpened] = useState(false);
  const [editing, setEditing] = useState(false);

  const hasKey = calApiKey.trim().length > 0;
  const hasEvent = calEventTypeId.replace(/\D/g, "").length > 0;
  const hasTz = calTimezone.trim().length > 0;
  // "Connected" = saved in the DB already, or all fields filled in this session.
  const connected = calConnected || (hasKey && hasEvent && hasTz);

  // Show the celebratory summary once connected — unless the owner chose to edit.
  if (connected && !editing) {
    return (
      <Card className="overflow-hidden border-accent/30">
        <div className="flex flex-col gap-4 bg-accent/[0.05] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-hover">
              <CalendarCheck className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Your calendar is connected</p>
                <Badge variant="success">Live</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your AI books real appointments straight into your Cal.com
                calendar during the call.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {hasEvent && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 font-medium">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    Appointment #{calEventTypeId.replace(/\D/g, "")}
                  </span>
                )}
                {hasTz && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 font-medium">
                    <Globe className="size-3.5 text-muted-foreground" />
                    {calTimezone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing(true)}
            className="shrink-0"
          >
            <Pencil className="size-4" />
            Update
          </Button>
        </div>
      </Card>
    );
  }

  const doneCount = [accountOpened || connected, hasKey || calConnected, hasEvent, hasTz].filter(
    Boolean
  ).length;

  return (
    <Card className="overflow-hidden">
      {/* Gradient hero header */}
      <div className="relative border-b border-border bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.06] p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary shadow-soft">
            <Calendar className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight">
                Book into your calendar
              </h3>
              <Badge variant="primary">Optional</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Let your AI drop real appointments straight into your calendar
              while it's still on the call. Four quick steps — no coding, all
              free.
            </p>
          </div>
        </div>
        {/* Progress meter */}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${(doneCount / 4) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {doneCount} of 4
          </span>
        </div>
      </div>

      {/* Stepper */}
      <ol className="p-6">
        <Step
          n={1}
          done={accountOpened || connected}
          title="Create a free Cal.com account"
          subtitle="Takes about a minute. Already have one? Just tick over and move on."
        >
          <a
            href="https://cal.com/signup"
            target="_blank"
            rel="noreferrer"
            onClick={() => setAccountOpened(true)}
          >
            <Button type="button" variant="outline">
              <ExternalLink className="size-4" />
              Open Cal.com
            </Button>
          </a>
        </Step>

        <Step
          n={2}
          done={hasKey || calConnected}
          icon={<KeyRound className="size-3.5 text-muted-foreground" />}
          title="Paste your connection key"
          subtitle="In Cal.com: Settings → Developer → API Keys → Add. Copy it here. We keep it private and never show it again."
        >
          <Input
            id="cal-key"
            type="password"
            autoComplete="off"
            value={calApiKey}
            onChange={(e) => setCalApiKey(e.target.value)}
            placeholder={
              calConnected ? "•••••••• saved — paste a new key to replace" : "cal_live_…"
            }
          />
        </Step>

        <Step
          n={3}
          done={hasEvent}
          icon={<Calendar className="size-3.5 text-muted-foreground" />}
          title="Choose which appointment to book"
          subtitle="Open your event type in Cal.com — the number at the end of its web address is the ID."
        >
          <Input
            id="cal-event"
            type="text"
            inputMode="numeric"
            value={calEventTypeId}
            onChange={(e) => setCalEventTypeId(e.target.value)}
            placeholder="e.g. 123456"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Example: cal.com/event-types/
            <span className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
              123456
            </span>
          </p>
        </Step>

        <Step
          n={4}
          done={hasTz}
          isLast
          icon={<Globe className="size-3.5 text-muted-foreground" />}
          title="Confirm your timezone"
          subtitle="So bookings land at the right local time."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="cal-tz"
              type="text"
              value={calTimezone}
              onChange={(e) => setCalTimezone(e.target.value)}
              placeholder="America/New_York"
              className="sm:max-w-xs"
            />
            <Button
              type="button"
              variant="subtle"
              onClick={() => {
                try {
                  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  if (tz) setCalTimezone(tz);
                } catch {
                  /* ignore — they can type it */
                }
              }}
            >
              Detect mine
            </Button>
          </div>
        </Step>
      </ol>

      {/* Footer reassurance */}
      <div className="flex items-start gap-2 border-t border-border bg-muted/30 px-6 py-4">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-hover" />
        <p className="text-xs text-muted-foreground">
          Done? Hit <strong>Save settings</strong> below and your AI starts
          booking on the very next call.
        </p>
      </div>
    </Card>
  );
}

/** One row of the calendar-connect stepper: numbered indicator + content. */
function Step({
  n,
  done,
  title,
  subtitle,
  icon,
  isLast,
  children,
}: {
  n: number;
  done: boolean;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <li className={cn("relative flex gap-4", isLast ? "pb-0" : "pb-7")}>
      {/* connector line to the next step */}
      {!isLast && (
        <span className="absolute left-4 top-9 bottom-0 w-px -translate-x-1/2 bg-border" />
      )}
      {/* numbered / checked indicator */}
      <span
        className={cn(
          "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors",
          done
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-card text-muted-foreground"
        )}
      >
        {done ? <Check className="size-4" /> : n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-semibold">{title}</h4>
          {icon}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        <div className="mt-3">{children}</div>
      </div>
    </li>
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
