import { Sparkles } from "lucide-react";

type SectionDividerProps = {
  className?: string;
};

/**
 * Global premium divider with locked, consistent vertical spacing.
 * Use this anywhere you need the gold-sparkles separator between major sections.
 * Divider has consistent padding both above and below to ensure centered appearance.
 */
export function SectionDivider({ className }: SectionDividerProps) {
  return (
    <section className={`bg-black py-8 md:py-10 ${className ?? ""}`.trim()}>
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
