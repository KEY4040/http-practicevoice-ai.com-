import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

/**
 * Interactive "missed-revenue" calculator. Turns the product's revenue-
 * attribution DNA into a pre-sale hook: a prospect estimates the money they
 * lose to missed calls, and sees it dwarf the plan price. Pure client-side.
 */

interface Field {
  key: "callsPerDay" | "missedPct" | "patientValue";
  label: string;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  prefix?: string;
}

const FIELDS: Field[] = [
  { key: "callsPerDay", label: "Calls your business gets per day", min: 5, max: 100, step: 1 },
  { key: "missedPct", label: "Percent you miss (busy, after-hours, lunch)", min: 5, max: 60, step: 1, suffix: "%" },
  { key: "patientValue", label: "Average value of a booked job or appointment", min: 50, max: 1500, step: 10, prefix: "$" },
];

// Conservative share of recovered calls that turn into a booked patient.
const BOOKING_RATE = 0.35;
const OPEN_DAYS_PER_MONTH = 22;
const PRO_PLAN = 199;

export function MissedRevenueCalculator() {
  const [values, setValues] = useState({
    callsPerDay: 30,
    missedPct: 25,
    patientValue: 300,
  });

  const { perMonth, perYear, roiMultiple } = useMemo(() => {
    const missedCallsMonth =
      values.callsPerDay * OPEN_DAYS_PER_MONTH * (values.missedPct / 100);
    const recovered = missedCallsMonth * BOOKING_RATE * values.patientValue;
    return {
      perMonth: Math.round(recovered),
      perYear: Math.round(recovered * 12),
      roiMultiple: recovered > 0 ? Math.max(1, Math.round(recovered / PRO_PLAN)) : 0,
    };
  }, [values]);

  return (
    <section id="roi" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="success" className="mb-4">
            <TrendingUp className="size-3.5" />
            ROI calculator
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            How much are missed calls costing you?
          </h2>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            Every missed call is a customer who called someone else. Move the
            sliders — see what you're leaving on the table.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Inputs */}
          <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="space-y-7">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor={f.key} className="min-w-0 text-sm font-medium text-muted-foreground">
                      {f.label}
                    </label>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                      {f.prefix}
                      {values[f.key].toLocaleString("en-US")}
                      {f.suffix}
                    </span>
                  </div>
                  <input
                    id={f.key}
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={values[f.key]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                    aria-valuetext={`${f.prefix ?? ""}${values[f.key]}${f.suffix ?? ""}`}
                  />
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Estimate assumes {OPEN_DAYS_PER_MONTH} open days/month and that ~
              {Math.round(BOOKING_RATE * 100)}% of recovered calls book. Your
              real numbers show in your dashboard.
            </p>
          </div>

          {/* Result */}
          <div className="flex min-w-0 flex-col justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary to-[hsl(224_76%_32%)] p-6 text-center text-primary-foreground shadow-elevated sm:p-8">
            <p className="text-sm font-medium text-primary-foreground/80">
              You could be recovering
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl lg:text-6xl">
              {formatCurrency(perMonth)}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">per month</p>
            <div className="mx-auto mt-6 w-full max-w-xs rounded-xl bg-white/10 p-4">
              <p className="text-sm text-primary-foreground/80">
                That's{" "}
                <span className="font-bold text-white">
                  {formatCurrency(perYear)}/year
                </span>{" "}
                — about{" "}
                <span className="font-bold text-white">{roiMultiple}×</span> the
                cost of the Professional plan.
              </p>
            </div>
            <Button asChild size="lg" variant="outline" className="mt-6 border-transparent bg-white text-primary hover:bg-white/90 hover:text-primary">
              <Link to="/demo">
                See it in your dashboard
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
