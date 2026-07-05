import { Link } from "react-router-dom";
import {
  ArrowRight,
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  Lock,
  HeartPulse,
  Clock,
  MessageSquareText,
  Sparkles,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PhoneDemo } from "@/components/marketing/PhoneDemo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { cn } from "@/lib/utils";

/* ------------------------------- Hero ----------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary/[0.04] to-transparent" />
      <div className="container-page grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-in">
          <Badge variant="primary" className="mb-5">
            <Sparkles className="size-3.5" />
            Built for medical, dental &amp; legal practices
          </Badge>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Never miss another{" "}
            <span className="gradient-text">patient call</span>.
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Your AI receptionist answers every call, books the appointment, and
            shows you the revenue it brought in. No missed patients, no
            voicemail — live in 5 minutes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/pricing">
                Start 14-day free trial
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">See live dashboard</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-accent" />
              Set up in under 5 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" />
              HIPAA-conscious &amp; secure
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-warning text-warning" />
              4.9/5 from 200+ practices
            </span>
          </div>
        </div>

        <div className="animate-fade-in-slow">
          <PhoneDemo />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Trust bar -------------------------------- */

const trustItems = [
  { Icon: ShieldCheck, label: "HIPAA-conscious" },
  { Icon: Lock, label: "Encrypted & secure" },
  { Icon: HeartPulse, label: "Built for healthcare" },
  { Icon: Clock, label: "24/7 availability" },
];

function TrustBar() {
  return (
    <section className="border-y border-border bg-muted/40">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-10 gap-y-4 py-6">
        {trustItems.map(({ Icon, label }) => (
          <div
            key={label}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <Icon className="size-4 text-primary" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- Benefit cards ----------------------------- */

const benefits = [
  {
    Icon: PhoneCall,
    title: "Never miss a call",
    body: "Every call answered on the first ring — nights, weekends, lunch, holidays. No hold music, no voicemail, no patient left behind.",
    accent: "primary" as const,
  },
  {
    Icon: CalendarCheck,
    title: "Books appointments for you",
    body: "The AI checks your calendar, books the right provider, and texts a confirmation — while your team helps the patients in the chair.",
    accent: "accent" as const,
  },
  {
    Icon: TrendingUp,
    title: "Shows the revenue it makes you",
    body: "Every booked call is tied to real dollars, so you see exactly what your AI receptionist earns you each month.",
    accent: "primary" as const,
  },
];

function Benefits() {
  return (
    <section id="product" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="success" className="mb-4">
            Built for busy front desks
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Every call your front desk misses — handled
          </h2>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            Lunch breaks, after hours, two lines ringing at once. We catch them
            all and turn them into booked patients.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {benefits.map(({ Icon, title, body, accent }) => (
            <div
              key={title}
              className="group rounded-xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-xl",
                  accent === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/12 text-accent-hover"
                )}
              >
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Revenue highlight -------------------------- */

function RevenueHighlight() {
  const stats = [
    { value: "$74,160", label: "Revenue booked this month" },
    { value: "412", label: "Appointments booked" },
    { value: "137", label: "After-hours calls saved" },
    { value: "100%", label: "Calls answered" },
  ];
  return (
    <section className="py-4">
      <div className="container-page">
        <div className="overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary to-[hsl(224_76%_32%)] px-7 py-12 text-primary-foreground shadow-elevated sm:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4 border-transparent bg-white/15 text-white">
              The differentiator
            </Badge>
            <h2 className="text-balance text-3xl font-bold sm:text-4xl">
              The only receptionist that shows you the money it makes
            </h2>
            <p className="mt-4 text-balance text-primary-foreground/80">
              Every answered call, tied to booked revenue. You see the ROI in
              real dollars — not guesswork.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-primary-foreground/75">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- How it works ------------------------------ */

const steps = [
  {
    Icon: PhoneCall,
    title: "Connect your number",
    body: "Forward your existing practice line in a couple of taps. No new hardware, no porting headaches.",
  },
  {
    Icon: CalendarCheck,
    title: "Sync your calendar",
    body: "One click to connect Google Calendar. The AI books into real open slots with the right provider.",
  },
  {
    Icon: MessageSquareText,
    title: "Go live in minutes",
    body: "Your AI receptionist starts answering, booking, and texting confirmations — with full transcripts.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            Live in under 5 minutes
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Setup so simple, you'll be answering calls today
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-xl border border-border bg-card p-7 shadow-card">
              <span
                aria-hidden="true"
                className="absolute right-6 top-6 text-5xl font-extrabold text-primary/15"
              >
                {i + 1}
              </span>
              <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- CTA ----------------------------------- */

function FinalCTA() {
  return (
    <section className="pb-24">
      <div className="container-page">
        <div className="rounded-[1.75rem] border border-border bg-muted/40 px-7 py-14 text-center sm:px-12">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Stop sending patients to voicemail
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
            Join 200+ practices that never miss a call. 14-day free trial, live
            in 5 minutes, cancel anytime.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/pricing">
                Start free trial
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Page ----------------------------------- */

export default function Home() {
  useDocumentMeta({
    title: "PracticeVoice AI — Never miss another patient call",
    description:
      "The AI voice receptionist for medical, dental, and legal practices. Book appointments 24/7 and see the revenue your AI generates.",
    path: "/",
  });
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <Hero />
        <TrustBar />
        <Benefits />
        <RevenueHighlight />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
