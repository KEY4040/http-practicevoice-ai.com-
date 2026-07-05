import { CalendarCheck, PhoneMissed, ArrowUpRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CallOutcome } from "@/data/mockData";

const CONFIG: Record<
  CallOutcome,
  { label: string; variant: "success" | "warning" | "danger" | "primary"; Icon: typeof Info }
> = {
  booked: { label: "Booked", variant: "success", Icon: CalendarCheck },
  escalated: { label: "Escalated", variant: "warning", Icon: ArrowUpRight },
  missed: { label: "Missed", variant: "danger", Icon: PhoneMissed },
  info: { label: "Info", variant: "primary", Icon: Info },
};

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  const { label, variant, Icon } = CONFIG[outcome];
  return (
    <Badge variant={variant}>
      <Icon className="size-3.5" />
      {label}
    </Badge>
  );
}
