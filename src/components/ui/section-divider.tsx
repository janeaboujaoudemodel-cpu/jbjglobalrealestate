type SectionDividerProps = {
  className?: string;
  fullWidth?: boolean;
  bg?: string;
  variant?: "default" | "champagne";
};

/**
 * Global premium divider — monochrome design system.
 * Renders two thin white/gray gradient lines.
 */
export function SectionDivider({ className, fullWidth = false, bg, variant = "default" }: SectionDividerProps) {
  const bgClass = bg ?? "bg-white";

  return (
    <div role="separator" aria-hidden="true" className={`${bgClass} py-4 md:py-6 ${className ?? ""}`.trim()}>
      <div className={fullWidth 
        ? "w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16" 
        : "container mx-auto px-4"
      }>
        <div className="flex items-center justify-center gap-6 md:gap-10">
          <div
            className="h-px flex-1 rounded-full"
            style={{
              minWidth: 80,
              background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 25%, rgba(0,0,0,0.12) 75%, transparent 100%)",
            }}
          />
          <div
            className="h-px flex-1 rounded-full"
            style={{
              minWidth: 80,
              background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 25%, rgba(0,0,0,0.12) 75%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
