import {
  Bot,
  CalendarCheck,
  MessageSquareText,
  Star,
  TrendingUp,
  Languages,
  Clock,
  CalendarClock,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * "Everything your front desk does" feature grid — native + responsive.
 * Honest by design: live features are unmarked; not-yet-shipped ones carry a
 * "Coming soon" badge so the page never overclaims.
 */
const FEATURES = [
  { Icon: Bot, title: "Answers every call", body: "A warm AI receptionist picks up on the first ring, 24/7 — nights, weekends, lunch.", soon: false },
  { Icon: CalendarCheck, title: "Books appointments", body: "Captures the who/what/when and books it into your PracticeVoice calendar.", soon: false },
  { Icon: MessageSquareText, title: "Sends text confirmations", body: "Texts the caller a confirmation the moment something's booked.", soon: false },
  { Icon: Star, title: "VIP Passthrough", body: "Your people ring straight to your cell; everyone else gets the AI.", soon: false },
  { Icon: TrendingUp, title: "Revenue dashboard", body: "See the real dollars every answered call brought in — not just 'minutes'.", soon: false },
  { Icon: Languages, title: "Speaks their language", body: "Answers in English, Spanish, and more — automatically, no setup.", soon: false },
  { Icon: Clock, title: "Live the same day", body: "Forward your number, set your hours, and you're answering calls today.", soon: false },
  { Icon: CalendarClock, title: "Two-way calendar sync", body: "Sync straight into Google Calendar so bookings land on your real schedule.", soon: true },
  { Icon: Mail, title: "Email lead alerts", body: "Get new leads emailed to you, alongside the instant text alert.", soon: true },
];

export function FeatureHub() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            One AI, the whole front desk
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your front desk does — <span className="gradient-text">without the desk</span>.
          </h2>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            The all-in-one AI voice line built for any business that lives on the
            phone.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body, soon }) => (
            <div
              key={title}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
            >
              {soon && (
                <Badge variant="neutral" className="absolute right-4 top-4">
                  Coming soon
                </Badge>
              )}
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
