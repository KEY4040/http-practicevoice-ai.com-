import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
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
  const positive = delta >= 0;
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
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            positive ? "bg-accent/12 text-accent-hover" : "bg-destructive/10 text-destructive"
          )}
        >
          {positive ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          {Math.abs(delta)}%
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
