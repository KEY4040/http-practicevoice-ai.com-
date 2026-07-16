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
  Languages,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PhoneDemo } from "@/components/marketing/PhoneDemo";
import { AudioDemo } from "@/components/marketing/AudioDemo";
import { FeatureHub } from "@/components/marketing/FeatureHub";
import { VipSection } from "@/components/marketing/VipSection";
import { Testimonials } from "@/components/marketing/Testimonials";
import { MissedRevenueCalculator } from "@/components/marketing/MissedRevenueCalculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { cn } from "@/lib/utils";
import { PLANS, PLAN_MINUTES } from "@/data/plans";

/* ------------------------------- Hero ----------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary/[0.04] to-transparent" />
      <div className="container-page grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-in">
          <Badge variant="primary" className="mb-5">
            <Sparkles className="size-3.5" />
            Built for every business that answers the phone
          </Badge>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Never miss another{" "}
            <span className="gradient-text">customer call</span>.
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Your AI receptionist answers every call, books the job or
            appointment, and shows you the revenue it brought in. No missed
            callers, no voicemail — live the same day.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/pricing">
                Start — $9.99 for 14 days
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/demo">See live dashboard</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-accent" />
              Set up in minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" />
              HIPAA-ready &amp; secure
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="size-4 text-accent" />
              See the revenue it books
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="size-4 text-accent" />
              Speaks your caller's language
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
  { Icon: ShieldCheck, label: "HIPAA-ready" },
  { Icon: Lock, label: "Encrypted & secure" },
  { Icon: HeartPulse, label: "Built for every front desk" },
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
    body: "Every call answered on the first ring — nights, weekends, lunch, holidays. No hold music, no voicemail, no caller left behind.",
    accent: "primary" as const,
  },
  {
    Icon: CalendarCheck,
    title: "Books jobs & appointments for you",
    body: "The AI books the right service at the right time and texts a confirmation — while your team helps the customers in front of them.",
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
            all and turn them into booked jobs and appointments.
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
              Sample dashboard
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
          <p className="mt-8 text-center text-xs text-primary-foreground/60">
            Illustrative figures showing how the dashboard looks for an active
            business.
          </p>
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
    body: "Forward your existing business line in a couple of taps. No new hardware, no porting headaches.",
  },
  {
    Icon: CalendarCheck,
    title: "Set your hours & services",
    body: "Tell Ava your providers, services, and hours in Settings — she books the right slot and texts a confirmation.",
  },
  {
    Icon: MessageSquareText,
    title: "Go live the same day",
    body: "Your AI receptionist starts answering, booking, and texting confirmations — with full transcripts.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            Live the same day
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

/* --------------------------- Pricing snapshot --------------------------- */

function PricingPeek() {
  return (
    <section className="scroll-mt-20 border-y border-border bg-muted/30 py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            Simple, no surprises
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            $9.99 to start — then a flat monthly plan
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-balance text-muted-foreground">
            No minute math at 2 a.m. Every plan includes a set of call-minutes,
            and you always see the rate before you go a minute over — no
            per-minute surprises. Cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-7 shadow-card",
                p.highlighted ? "border-primary ring-1 ring-primary/20" : "border-border"
              )}
            >
              {p.badge && (
                <Badge variant="primary" className="mb-3 self-start">
                  {p.badge}
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight">${p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {PLAN_MINUTES[p.id].toLocaleString()} call-minutes / mo included
              </p>
              <Button asChild className="mt-6 w-full" variant={p.highlighted ? "primary" : "outline"}>
                <Link to="/pricing">Start — $9.99 for 14 days</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Want the full breakdown?{" "}
          <Link to="/pricing" className="font-semibold text-primary hover:underline">
            See full pricing &amp; features
          </Link>
        </p>
      </div>
    </section>
  );
}

/* -------------------------------- FAQ ----------------------------------- */

const faqs = [
  {
    q: "What is PracticeVoice AI?",
    a: "PracticeVoice AI is an AI voice receptionist for any business that answers the phone — home services, auto, salons, restaurants, real estate, medical, dental, legal, and community assistance lines. It answers every incoming call, books appointments and service calls around the clock, sends text confirmations, and shows the revenue each call generates.",
  },
  {
    q: "How does the AI receptionist answer calls?",
    a: "You forward your existing business line to PracticeVoice AI. A warm, professional AI voice answers on the first ring, understands what the caller needs, books the right appointment or job, and texts a confirmation — day or night.",
  },
  {
    q: "Is PracticeVoice AI HIPAA compliant?",
    a: "It's built for HIPAA-ready workflows: data is encrypted in transit and at rest, access is restricted to your authorized team, and a Business Associate Agreement (BAA) is available on qualifying plans for healthcare practices.",
  },
  {
    q: "How long does setup take?",
    a: "Most businesses are live the same day: forward your number, set your hours and services, and your AI receptionist starts answering and booking calls right away.",
  },
  {
    q: "How much does PracticeVoice AI cost?",
    a: "Plans start at $99/month, with Professional at $199/month and Premium at $399/month. Every plan starts at $9.99 for a 14-day trial, and you can cancel anytime.",
  },
  {
    q: "Which businesses is it built for?",
    a: "Any business that can't afford to miss a call — home services and trades, auto shops, salons and spas, restaurants, real estate teams, medical, dental, and veterinary offices, law firms, and nonprofit or community assistance lines.",
  },
  {
    q: "Can it talk to callers in other languages?",
    a: "Yes. Your AI answers in the caller's own language automatically — it greets in English and switches to Spanish (or dozens of other languages) the moment the caller does, with no setup on your part.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="neutral" className="mb-4">
            Frequently asked questions
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to know
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((item) => (
            <details key={item.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <h3 className="text-base font-semibold">{item.q}</h3>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Industries hub ----------------------------- */
// Hub-and-spoke internal linking: the homepage points to every use-case page,
// which is the strongest single SEO signal for those pages.
const industries = [
  { label: "Home services", href: "/home-services", note: "HVAC, plumbing, electrical, roofing" },
  { label: "Contractors & trades", href: "/contractors", note: "Capture every estimate request" },
  { label: "Auto shops", href: "/auto", note: "Book service and after-hours tows" },
  { label: "Salons & spas", href: "/salons", note: "Fill every chair, cut no-shows" },
  { label: "Real estate", href: "/real-estate", note: "Never let a lead hit voicemail" },
  { label: "Restaurants", href: "/restaurants", note: "Reservations and catering, 24/7" },
  { label: "Medical & dental", href: "/medical", note: "Answer and triage every patient" },
  { label: "Veterinary", href: "/veterinary", note: "Book visits, flag emergencies" },
  { label: "Law firms", href: "/legal", note: "Win the new-client race" },
  { label: "Assistance lines", href: "/assistance-line", note: "Nonprofit & 211-style intake" },
];

function IndustriesHub() {
  return (
    <section id="industries" className="scroll-mt-20 py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            One receptionist, every industry
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            If your phone rings, PracticeVoice answers it
          </h2>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            Different businesses, same problem: the call you miss is the customer
            you lose. Here's what that looks like in your world.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((it) => (
            <Link
              key={it.href}
              to={it.href}
              className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <span>
                <span className="block font-semibold group-hover:text-primary">
                  {it.label}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {it.note}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
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
            Stop sending callers to voicemail
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
            Become one of our founding businesses. $9.99 to start, then your
            plan, live the same day, cancel anytime.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/pricing">
                Start for $9.99
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
    title: "PracticeVoice AI — Never miss another customer call",
    description:
      "The AI voice receptionist for any business that answers the phone. Book jobs and appointments 24/7 and see the revenue your AI generates.",
    path: "/",
  });
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <Hero />
        <TrustBar />
        <AudioDemo />
        <Benefits />
        <FeatureHub />
        <VipSection />
        <IndustriesHub />
        <RevenueHighlight />
        <MissedRevenueCalculator />
        <Testimonials />
        <HowItWorks />
        <PricingPeek />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
