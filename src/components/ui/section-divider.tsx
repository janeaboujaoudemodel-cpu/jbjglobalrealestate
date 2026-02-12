import { Sparkles } from "lucide-react";

type SectionDividerProps = {
  className?: string;
  /** Use full-width layout for dividers adjacent to edge-to-edge sections */
  fullWidth?: boolean;
  /** Override the default bg-black background (e.g. for champagne-toned pages) */
  bg?: string;
  /** Use "champagne" for light-background pages */
  variant?: "default" | "champagne";
};

/**
 * Global premium divider with locked, consistent vertical spacing.
 * Use this anywhere you need the gold-sparkles separator between major sections.
 * Use variant="champagne" for dividers on champagne/light backgrounds.
 */
export function SectionDivider({ className, fullWidth = false, bg, variant = "default" }: SectionDividerProps) {
  const bgClass = bg ?? (variant === "champagne" 
    ? "bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark" 
    : "bg-black");

  return (
    <section className={`${bgClass} py-14 md:py-20 ${className ?? ""}`.trim()}>
      <div className={fullWidth 
        ? "w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16" 
        : "container mx-auto px-4"
      }>
        <div className="flex items-center justify-center gap-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <Sparkles className="w-4 h-4 text-gold/50" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
