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
    <div role="separator" aria-hidden="true" className={`${bgClass} py-4 md:py-6 ${className ?? ""}`.trim()}>
      <div className={fullWidth 
        ? "w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16" 
        : "container mx-auto px-4"
      }>
        <div className="flex items-center justify-center gap-4 md:gap-6">
          <div className="h-[2px] min-w-[72px] flex-1 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_0_10px_hsl(var(--gold)/0.35)]" />
          <Sparkles className="w-4 h-4 text-gold" />
          <div className="h-[2px] min-w-[72px] flex-1 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_0_10px_hsl(var(--gold)/0.35)]" />
        </div>
      </div>
    </div>
  );
}
