import { cn } from "@/lib/utils";
// jbj-monogram-transparent.png: black J letters, no black box behind B - for light backgrounds
import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png";
// Official white monogram for emerald, black, and photographic surfaces.
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";

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
  lg: { width: 72, height: 72, wordmark: "text-sm md:text-base" },  // Mobile menu header
  xl: { width: 80, height: 80, wordmark: "text-base md:text-lg" },  // Hamburger dropdown branding
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
  const isLightIdentity = variant === "light";
  const wordmarkColor = isLightIdentity ? "text-white" : "text-foreground";
  const logoSrc = isLightIdentity ? jbjMonogramLightTransparent : jbjMonogramTransparent;

  return (
    <div
      className={cn(
        "inline-flex",
        layout === "horizontal"
          ? "items-center gap-3"
          : "flex-col items-center gap-3",
        className
      )}
    >
      {/* Monogram Image */}
      <img 
        src={logoSrc}
        alt="JBJ Global Real Estate"
        width={cfg.width}
        height={cfg.height}
        className="object-contain"
        style={{ width: cfg.width, height: cfg.height }}
       loading="lazy" decoding="async" />

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
            <span className={cn("mt-2 block text-xs tracking-[0.2em] uppercase", wordmarkColor)}>
              {subline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Header-specific monogram - horizontal layout with transparent image (no black box)
// Larger size on mobile for better visibility
export function BrandMonogramHeader({ className = "" }: { className?: string }) {
  return (
    <div 
      className={cn("flex items-center gap-2 md:gap-3", className)}
    >
      <img 
        src={jbjMonogramLightTransparent}
        alt="JBJ"
        width={48}
        height={48}
        className="object-contain w-12 h-12 md:w-10 md:h-10"
       loading="lazy" decoding="async" />
      <span className="text-white font-semibold text-base md:text-base tracking-[0.12em] uppercase">
        Global Real Estate
      </span>
    </div>
  );
}
