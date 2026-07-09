import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  delta,
  hint,
  Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  delta: number;
  hint: string;
  Icon: LucideIcon;
  highlight?: boolean;
}) {
  // 0% is neutral, not "up" — don't imply growth where there was none.
  const trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <Card
      className={cn(
        "p-5",
        highlight && "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl",
            highlight ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
          )}
        >
          <Icon className="size-5" />
        </span>
        <span
          title="vs. previous 30 days"
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            trend === "up" && "bg-accent/12 text-accent-hover",
            trend === "down" && "bg-destructive/10 text-destructive",
            trend === "flat" && "bg-muted text-muted-foreground"
          )}
        >
          {trend === "up" && <ArrowUpRight className="size-3.5" />}
          {trend === "down" && <ArrowDownRight className="size-3.5" />}
          {trend === "flat" && <Minus className="size-3.5" />}
          {Math.abs(delta)}%
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
