import { Sparkles } from "lucide-react";

type SectionDividerProps = {
  className?: string;
  compact?: boolean;
};

/**
 * Global premium divider with locked, symmetric vertical spacing.
 * Use this anywhere you need the gold-sparkles separator between major sections.
 * Set compact=true for reduced spacing between tightly grouped sections.
 */
export function SectionDivider({ className, compact = false }: SectionDividerProps) {
  return (
    <section className={`bg-black ${compact ? 'py-4 md:py-5' : 'py-6 md:py-8'} ${className ?? ""}`.trim()}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <Sparkles className="w-4 h-4 text-gold/50" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
