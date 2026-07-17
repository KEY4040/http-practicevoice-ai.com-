import { useEffect, useRef, useState } from "react";
import { Phone, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Line {
  speaker: "ai" | "caller";
  text: string;
}

interface Scenario {
  /** Label for the booking-confirmed card ("Appointment booked", "Job booked"…). */
  bookedTitle: string;
  /** One-line detail under the confirmation. */
  bookedDetail: string;
  script: Line[];
}

// The hero rotates through industries so any visitor — a dental office, a law
// firm, a home-services crew — sees a call that looks like theirs. "Ava" (the
// AI) is constant; only the business and the job change.
const SCENARIOS: Scenario[] = [
  {
    bookedTitle: "Appointment booked",
    bookedDetail: "Cleaning · Tue 10:00 AM · Dr. Patel — confirmation sent by SMS",
    script: [
      { speaker: "ai", text: "Thanks for calling Bayview Dental, this is Ava. How can I help?" },
      { speaker: "caller", text: "Hi, I'd like to book a cleaning for next week." },
      { speaker: "ai", text: "Of course! I have Tuesday at 10 AM with Dr. Patel. Does that work?" },
      { speaker: "caller", text: "That's perfect, thank you." },
      { speaker: "ai", text: "You're all set — I'll text a confirmation now. 💙" },
    ],
  },
  {
    bookedTitle: "Consult booked",
    bookedDetail: "Injury consult · Thu 2:00 PM · Ms. Hale — confirmation sent by SMS",
    script: [
      { speaker: "ai", text: "Thank you for calling Morgan & Hale Law, this is Ava. How can I help?" },
      { speaker: "caller", text: "I was in a car accident — do I have a case?" },
      { speaker: "ai", text: "I'm sorry that happened. I can book a free consult with Ms. Hale, Thursday at 2. Okay?" },
      { speaker: "caller", text: "Yes, please book it." },
      { speaker: "ai", text: "Done — I'll text a confirmation and what to bring. 💙" },
    ],
  },
  {
    bookedTitle: "Job booked",
    bookedDetail: "AC repair · Today 2:00–4:00 PM · Tech Danny — confirmation sent by SMS",
    script: [
      { speaker: "ai", text: "Thanks for calling Summit Home Services, this is Ava. How can I help?" },
      { speaker: "caller", text: "My AC quit and it's 95 degrees out." },
      { speaker: "ai", text: "Let's get you cooled down — I have a tech open today, 2 to 4. Want it?" },
      { speaker: "caller", text: "Yes, send someone please." },
      { speaker: "ai", text: "You're booked — I'll text your arrival window now. 💙" },
    ],
  },
];

/**
 * Auto-playing "live call" simulation for the hero. Reveals one message at a
 * time, then a booking-confirmed card, then advances to the next industry
 * scenario and repeats. Purely presentational.
 */
export function PhoneDemo() {
  const [scenario, setScenario] = useState(0);
  const [visible, setVisible] = useState(0);
  const [booked, setBooked] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const current = SCENARIOS[scenario];

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisible(0);
    setBooked(false);

    const { script } = current;
    script.forEach((_, i) => {
      timers.current.push(setTimeout(() => setVisible(i + 1), 1100 + i * 1600));
    });
    timers.current.push(
      setTimeout(() => setBooked(true), 1100 + script.length * 1600)
    );
    // Hand off to the next industry scenario; changing `scenario` re-runs this
    // effect, which resets and plays the next call.
    timers.current.push(
      setTimeout(
        () => setScenario((s) => (s + 1) % SCENARIOS.length),
        1100 + script.length * 1600 + 3200
      )
    );

    return () => timers.current.forEach(clearTimeout);
  }, [scenario, current]);

  return (
    // Decorative, auto-playing simulation — hide from assistive tech so a
    // screen reader doesn't announce a fake "incoming call" as real content.
    <div className="relative mx-auto w-full max-w-[340px]" aria-hidden="true">
      {/* Ambient glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-2xl" />

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-elevated">
        {/* Call header */}
        <div className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
          <span className="relative grid size-10 place-items-center rounded-full bg-white/15">
            <Phone className="size-5" />
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/40" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Incoming call · Ava</p>
            <p className="text-xs text-primary-foreground/75">
              Answered in 0.8s · AI receptionist
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium">
            <span className="size-2 animate-pulse rounded-full bg-accent" />
            Live
          </span>
        </div>

        {/* Transcript — FIXED height (not min-height) so the looping animation
            never changes the card's size and shoves the rest of the page up and
            down while it plays. Content is pinned to the BOTTOM (justify-end) so
            the card fills like a real chat and never opens a big empty void at
            the start of the loop. Overflow is clipped; oldest bubbles scroll off
            the top. */}
        <div className="flex h-[360px] flex-col justify-end gap-3 overflow-hidden bg-muted/40 p-4">
          {/* Never-empty state: a live "connecting" cue before the first line
              lands, so the card always shows something alive. */}
          {visible === 0 && !booked && (
            <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm bg-primary px-3.5 py-3 text-primary-foreground shadow-soft">
              <span className="size-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-white/70" />
            </div>
          )}

          {current.script.slice(0, visible).map((line, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] animate-fade-in rounded-2xl px-3.5 py-2.5 text-sm shadow-soft",
                line.speaker === "ai"
                  ? "self-start rounded-bl-sm bg-primary text-primary-foreground"
                  : "self-end rounded-br-sm bg-card text-foreground"
              )}
            >
              {line.text}
            </div>
          ))}

          {booked && (
            <div className="animate-fade-in rounded-xl border border-accent/30 bg-accent/10 p-3.5">
              <div className="flex items-center gap-2 text-accent-hover">
                <CalendarCheck className="size-4" />
                <span className="text-sm font-semibold">{current.bookedTitle}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {current.bookedDetail}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
