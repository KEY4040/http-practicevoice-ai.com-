import { useEffect, useRef, useState } from "react";
import { Phone, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Line {
  speaker: "ai" | "caller";
  text: string;
}

const SCRIPT: Line[] = [
  { speaker: "ai", text: "Thanks for calling Bayview Dental, this is Ava. How can I help?" },
  { speaker: "caller", text: "Hi, I'd like to book a cleaning for next week." },
  { speaker: "ai", text: "Of course! I have Tuesday at 10 AM with Dr. Patel. Does that work?" },
  { speaker: "caller", text: "That's perfect, thank you." },
  { speaker: "ai", text: "You're all set — I'll text a confirmation now. 💙" },
];

/**
 * Auto-playing "live call" simulation for the hero. Reveals one message at a
 * time, then a booking-confirmed card, then loops. Purely presentational.
 */
export function PhoneDemo() {
  const [visible, setVisible] = useState(0);
  const [booked, setBooked] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function run() {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setVisible(0);
      setBooked(false);

      SCRIPT.forEach((_, i) => {
        timers.current.push(
          setTimeout(() => setVisible(i + 1), 1100 + i * 1600)
        );
      });
      timers.current.push(
        setTimeout(() => setBooked(true), 1100 + SCRIPT.length * 1600)
      );
      // Loop
      timers.current.push(
        setTimeout(run, 1100 + SCRIPT.length * 1600 + 3200)
      );
    }
    run();
    return () => timers.current.forEach(clearTimeout);
  }, []);

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

        {/* Transcript */}
        <div className="flex min-h-[300px] flex-col gap-3 bg-muted/40 p-4">
          {SCRIPT.slice(0, visible).map((line, i) => (
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
            <div className="mt-auto animate-fade-in rounded-xl border border-accent/30 bg-accent/10 p-3.5">
              <div className="flex items-center gap-2 text-accent-hover">
                <CalendarCheck className="size-4" />
                <span className="text-sm font-semibold">Appointment booked</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cleaning · Tue 10:00 AM · Dr. Patel — confirmation sent by SMS
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
