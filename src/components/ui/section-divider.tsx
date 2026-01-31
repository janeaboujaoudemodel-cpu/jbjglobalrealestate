import { Sparkles } from "lucide-react";

type SectionDividerProps = {
  className?: string;
};

/**
 * Global premium divider with locked, symmetric vertical spacing.
 * Use this anywhere you need the gold-sparkles separator between major sections.
 */
export function SectionDivider({ className }: SectionDividerProps) {
  return (
    <section className={"bg-black py-10 md:py-14 " + (className ?? "")}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <Sparkles className="w-5 h-5 text-gold/50" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
