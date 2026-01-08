import { cn } from "@/lib/utils";

type BrandMonogramVariant = "dark" | "light";
type BrandMonogramSize = "sm" | "md" | "lg" | "xl";
type BrandMonogramLayout = "horizontal" | "stacked";

const sizeConfig: Record<BrandMonogramSize, {
  j: string;
  divider: string;
  wordmark: string;
  gap: string;
  b: string;
}> = {
  sm: {
    j: "text-xl md:text-2xl",
    divider: "h-5 md:h-6",
    wordmark: "text-[10px] md:text-xs",
    gap: "mx-1.5 md:mx-2",
    b: "text-[10px] md:text-xs",
  },
  md: {
    j: "text-2xl md:text-3xl",
    divider: "h-6 md:h-7",
    wordmark: "text-xs md:text-sm",
    gap: "mx-2 md:mx-2.5",
    b: "text-xs md:text-sm",
  },
  lg: {
    j: "text-4xl md:text-5xl",
    divider: "h-10 md:h-12",
    wordmark: "text-sm md:text-base",
    gap: "mx-3 md:mx-3.5",
    b: "text-base md:text-lg",
  },
  xl: {
    j: "text-5xl md:text-6xl lg:text-7xl",
    divider: "h-12 md:h-14 lg:h-16",
    wordmark: "text-base md:text-lg",
    gap: "mx-4 md:mx-4.5",
    b: "text-lg md:text-xl lg:text-2xl",
  },
};

export function BrandMonogram({
  variant = "dark",
  size = "md",
  layout = "stacked",
  showWordmark = true,
  subline,
  className,
}: {
  variant?: BrandMonogramVariant;
  size?: BrandMonogramSize;
  layout?: BrandMonogramLayout;
  showWordmark?: boolean;
  subline?: string;
  className?: string;
}) {
  const cfg = sizeConfig[size];

  const jColor = variant === "dark" ? "text-white" : "text-foreground";
  const wordmarkColor = variant === "dark" ? "text-white" : "text-foreground";

  return (
    <div
      className={cn(
        "inline-flex",
        layout === "horizontal"
          ? "items-center gap-3"
          : "flex-col items-center gap-3",
        className
      )}
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* Monogram */}
      <div className="flex items-center justify-center" aria-hidden="true">
        <span className={cn(jColor, "font-extralight leading-none", cfg.j)}>
          J
        </span>

        <span className={cn("flex items-center justify-center relative", cfg.gap)}>
          <span
            className={cn(
              "w-px bg-gradient-to-b from-transparent via-gold to-transparent",
              cfg.divider
            )}
          />
          {/* Gold B centered on divider */}
          <span 
            className={cn(
              "absolute text-gold font-semibold leading-none",
              cfg.b
            )}
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
            }}
          >
            B
          </span>
        </span>

        <span className={cn(jColor, "font-extralight leading-none", cfg.j)}>
          J
        </span>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div
          className={cn(
            layout === "horizontal" ? "flex items-center" : "text-center"
          )}
        >
          <span
            className={cn(
              wordmarkColor,
              "uppercase font-semibold leading-none",
              "tracking-[0.22em]",
              cfg.wordmark
            )}
          >
            JBJ GLOBAL REAL ESTATE
          </span>
          {subline && layout === "stacked" && (
            <span className="mt-2 block text-gold text-xs tracking-[0.2em] uppercase">
              {subline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
