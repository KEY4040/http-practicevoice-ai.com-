import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary shadow-soft">
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path
            d="M6 6.5A1.5 1.5 0 0 1 7.5 5h1.2c.66 0 1.24.43 1.43 1.06l.62 2.05a1.5 1.5 0 0 1-.4 1.5l-.86.86a10.5 10.5 0 0 0 4.36 4.36l.86-.86a1.5 1.5 0 0 1 1.5-.4l2.05.62c.63.19 1.06.77 1.06 1.43v1.2A1.5 1.5 0 0 1 18.3 19 12.5 12.5 0 0 1 6 6.5Z"
            fill="#fff"
          />
          <circle cx="17.5" cy="6.5" r="2.2" fill="#10B981" />
        </svg>
      </span>
      <span
        className={cn(
          "text-lg font-bold tracking-tight",
          invert ? "text-white" : "text-foreground"
        )}
      >
        PracticeVoice<span className="text-[#047857]"> AI</span>
      </span>
    </Link>
  );
}
