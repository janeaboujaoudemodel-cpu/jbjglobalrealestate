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
 * ⚠️  LOCKED COMPONENT — DO NOT MODIFY ⚠️
 *
 * Global premium gold divider used across ALL pages.
 * Renders two thin elegant gold lines — NO stars, NO sparkles, NO icons.
 * The gold lines must ALWAYS be visible.
 *
 * Variant "champagne" adjusts only the background colour for light sections.
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
        <div className="flex items-center justify-center gap-6 md:gap-10">
          {/* Gold line — left */}
          <div
            className="h-px flex-1 rounded-full"
            style={{
              minWidth: 80,
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--gold)) 25%, hsl(var(--gold)) 75%, transparent 100%)",
              boxShadow: "0 0 8px hsl(var(--gold) / 0.35)",
            }}
          />
          {/* Gold line — right */}
          <div
            className="h-px flex-1 rounded-full"
            style={{
              minWidth: 80,
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--gold)) 25%, hsl(var(--gold)) 75%, transparent 100%)",
              boxShadow: "0 0 8px hsl(var(--gold) / 0.35)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
