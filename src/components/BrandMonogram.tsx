import { cn } from "@/lib/utils";
import jbjMonogramDark from "@/assets/jbj-monogram-dark.png";
import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png";

type BrandMonogramVariant = "dark" | "light" | "transparent";
type BrandMonogramSize = "xs" | "sm" | "md" | "lg" | "xl" | "footer";
type BrandMonogramLayout = "horizontal" | "stacked";

const sizeConfig: Record<BrandMonogramSize, {
  width: number;
  height: number;
  wordmark: string;
}> = {
  xs: { width: 32, height: 32, wordmark: "text-[9px]" },
  sm: { width: 48, height: 48, wordmark: "text-[10px] md:text-xs" },
  md: { width: 64, height: 64, wordmark: "text-xs md:text-sm" },
  lg: { width: 96, height: 96, wordmark: "text-sm md:text-base" },
  xl: { width: 120, height: 120, wordmark: "text-base md:text-lg" },
  footer: { width: 140, height: 140, wordmark: "text-sm" },
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
  const wordmarkColor = variant === "light" ? "text-foreground" : "text-white";
  
  // Use transparent version for light backgrounds, dark version for dark backgrounds
  const logoSrc = variant === "light" || variant === "transparent" 
    ? jbjMonogramTransparent 
    : jbjMonogramDark;

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
      {/* Monogram Image */}
      <img 
        src={logoSrc}
        alt="JBJ Global Real Estate"
        width={cfg.width}
        height={cfg.height}
        className="object-contain"
        style={{ width: cfg.width, height: cfg.height }}
      />

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

// Header-specific monogram - horizontal layout with image
export function BrandMonogramHeader({ className = "" }: { className?: string }) {
  return (
    <div 
      className={cn("flex items-center gap-3", className)}
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <img 
        src={jbjMonogramDark}
        alt="JBJ"
        width={40}
        height={40}
        className="object-contain"
        style={{ width: 40, height: 40 }}
      />
      <span className="text-white font-semibold text-sm md:text-base tracking-[0.12em] uppercase">
        Global Real Estate
      </span>
    </div>
  );
}
