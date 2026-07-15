import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Social proof — REAL customer quotes only.
 *
 * As you land happy customers, add them here (name + business + their words,
 * with permission). Until this array has entries the section renders nothing —
 * we never ship fabricated reviews, which would sink an investor conversation
 * and mislead buyers. One or two genuine quotes beats ten invented ones.
 */
type Testimonial = { quote: string; name: string; business: string };

const TESTIMONIALS: Testimonial[] = [
  // { quote: "...", name: "...", business: "..." },
];

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="py-20 lg:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="mb-4">
            <Star className="size-3.5" />
            What owners say
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Businesses that stopped missing calls
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-card"
            >
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold">
                {t.name}
                <span className="block font-normal text-muted-foreground">
                  {t.business}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
