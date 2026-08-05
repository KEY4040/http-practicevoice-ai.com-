import { useMemo, useState } from "react";
import { Search, Sparkles, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BEST_REP_PROMPTS, type BestRepPrompt } from "@/data/bestRepPrompts";

interface BestRepLibraryProps {
  /** Loads the chosen prompt into the "about" box. Returns whether it was applied. */
  onUse: (prompt: BestRepPrompt) => boolean;
}

/**
 * BestRep Prompt Library — industry-expert receptionist scripts the owner can
 * load into their AI's script box in one tap, then edit freely. Sits right
 * above the "Tell your AI about your business" field.
 */
export function BestRepLibrary({ onUse }: BestRepLibraryProps) {
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [usedSlug, setUsedSlug] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BEST_REP_PROMPTS;
    return BEST_REP_PROMPTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.keywords.toLowerCase().includes(q),
    );
  }, [query]);

  function handleUse(p: BestRepPrompt) {
    if (onUse(p)) {
      setUsedSlug(p.slug);
    }
  }

  return (
    <div className="rounded-xl border border-accent/25 bg-gradient-to-br from-accent/[0.05] to-primary/[0.04] p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <span className="text-sm font-semibold">BestRep Prompt Library</span>
          <Badge variant="neutral" className="text-[10px]">
            {BEST_REP_PROMPTS.length} experts
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Tap your industry to load a ready-made expert script into the box
          below. Then add your business name, hours, prices, and staff — edit
          anything.
        </p>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search — e.g. dental, HVAC, salon, law…"
          className="bg-background pl-9"
          aria-label="Search the prompt library"
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {results.map((p) => {
          const open = openSlug === p.slug;
          const used = usedSlug === p.slug;
          const tags = p.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
          return (
            <div
              key={p.slug}
              className="flex flex-col rounded-lg border border-border bg-background/70 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {p.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant={used ? "subtle" : "primary"}
                  size="sm"
                  onClick={() => handleUse(p)}
                  className="shrink-0"
                >
                  {used ? (
                    <>
                      <Check className="size-3.5" />
                      Loaded
                    </>
                  ) : (
                    "Use this prompt"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setOpenSlug(open ? null : p.slug)}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  aria-expanded={open}
                >
                  Keywords
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {open && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {results.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          No match for “{query}”. Try a broader word, or use the Instant AI
          Receptionist above to write one from scratch.
        </p>
      )}
    </div>
  );
}
