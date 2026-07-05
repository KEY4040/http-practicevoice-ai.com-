import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { callsOverTime } from "@/data/mockData";

const PRIMARY = "hsl(224 76% 40%)";
const ACCENT = "hsl(160 84% 39%)";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-elevated">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function CallsChart() {
  const totalCalls = callsOverTime.reduce((s, d) => s + d.calls, 0);
  const totalBooked = callsOverTime.reduce((s, d) => s + d.booked, 0);
  return (
    <div
      role="img"
      aria-label={`Calls over the last 14 days: ${totalCalls} answered and ${totalBooked} booked.`}
    >
      <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={callsOverTime} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="fillCalls" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.28} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillBooked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.24} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(214 32% 91%)" strokeDasharray="4 4" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(215 20% 45%)" }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(215 20% 45%)" }}
          width={40}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="calls"
          name="calls"
          stroke={PRIMARY}
          strokeWidth={2.5}
          fill="url(#fillCalls)"
        />
        <Area
          type="monotone"
          dataKey="booked"
          name="booked"
          stroke={ACCENT}
          strokeWidth={2.5}
          fill="url(#fillBooked)"
        />
      </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
