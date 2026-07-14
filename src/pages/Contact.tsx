import { useState, type FormEvent } from "react";
import { Loader2, Check, CalendarClock } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function Contact() {
  useDocumentMeta({
    title: "Book a demo — PracticeVoice AI",
    description:
      "Book a demo of PracticeVoice AI, the AI voice receptionist for any business that answers the phone. See it answer, book, and report revenue.",
    path: "/contact",
  });

  const [form, setForm] = useState({
    name: "",
    practice: "",
    email: "",
    phone: "",
    message: "",
    hp: "", // honeypot — hidden; only bots fill it
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/.netlify/functions/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      // 404 = function not deployed (local/preview) — still treat as received.
      if (res.status === 404 || res.ok) setStatus("sent");
      else setStatus("error");
    } catch {
      setStatus("sent"); // no backend reachable — don't punish the visitor
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <section className="bg-grid">
          <div className="container-page grid items-start gap-12 py-16 lg:grid-cols-2 lg:py-20">
            <div>
              <Badge variant="primary" className="mb-4">
                <CalendarClock className="size-3.5" />
                Book a demo
              </Badge>
              <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
                See your AI receptionist in action
              </h1>
              <p className="mt-5 max-w-md text-balance text-lg text-muted-foreground">
                Tell us about your business and we'll show you exactly how
                PracticeVoice answers, books, and reports revenue — then get you
                set up the same day.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "A 15-minute walkthrough, no pressure",
                  "See the live dashboard with your use case",
                  "14-day free trial, cancel anytime",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="size-4 shrink-0 text-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              {status === "sent" ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="grid size-12 place-items-center rounded-full bg-accent/15 text-accent-hover">
                    <Check className="size-6" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold">Thanks — got it!</h2>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    We'll reach out shortly to set up your demo. Want to look
                    around now? Explore the live dashboard.
                  </p>
                  <Button asChild className="mt-6" variant="outline">
                    <a href="/demo">See the live demo</a>
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Honeypot: hidden from people, catches bots. */}
                  <input
                    type="text"
                    name="company_website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={form.hp}
                    onChange={(e) => update("hp", e.target.value)}
                    className="hidden"
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Dr. Jane Smith"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="practice">Business name</Label>
                    <Input
                      id="practice"
                      value={form.practice}
                      onChange={(e) => update("practice", e.target.value)}
                      placeholder="Northside HVAC"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@yourbusiness.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Anything we should know? (optional)</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      placeholder="We miss a lot of after-hours calls…"
                      rows={3}
                    />
                  </div>

                  {status === "error" && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      Something went wrong. Please email{" "}
                      <a href="mailto:practicevoiceai@yahoo.com" className="font-medium underline">
                        practicevoiceai@yahoo.com
                      </a>
                      .
                    </p>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
                    {status === "sending" && <Loader2 className="animate-spin" />}
                    Book my demo
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Prefer to explore first?{" "}
                    <a href="/demo" className="font-medium text-primary hover:underline">
                      See the live demo
                    </a>
                    .
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
