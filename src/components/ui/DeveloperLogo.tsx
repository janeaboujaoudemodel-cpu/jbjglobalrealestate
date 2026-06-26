import { useState } from "react";
import { cn } from "@/lib/utils";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import { getDeveloperLogoOverride } from "@/utils/developerLogoOverrides";

interface DeveloperLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
  onError?: () => void;
  renderFallback?: boolean;
  name?: string | null;
  variant?: "tile" | "bare" | "card" | "nameplate";
}

// Unified champagne plate — identical between `bare` and `nameplate`
// so every project card has an identical badge footprint. Padding is
// kept minimal so wide wordmarks AND square marks both render at their
// maximum size without ever being cropped (object-contain enforced).
// Square-ish, ~35% smaller than the previous h-14 w-24 plate so cards feel
// closer to the Reelly reference. Padding stays minimal + object-contain
// is enforced on the <img/> so wide wordmarks AND square marks render at
// their largest fitting size and are NEVER cropped.
const UNIFIED_PLATE =
  "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden " +
  "rounded-lg bg-[#FDFBF7] border border-[#B89555]/45 " +
  "shadow-[0_3px_10px_rgba(0,0,0,0.16)] p-[4px]";


export function DeveloperLogo({
  src,
  alt = "Developer",
  className,
  loading = "lazy",
  onError,
  renderFallback = false,
  name,
  variant = "tile",
}: DeveloperLogoProps) {
  const [error, setError] = useState(false);

  const override = getDeveloperLogoOverride(name ?? alt);
  const valid = isValidDeveloperLogoUrl(src) && !error;

  // Shared label renderer — when a logo is missing, we ALWAYS keep the
  // identical square container and place readable INITIALS inside so the
  // name is never cropped. The full name appears next to the plate in
  // every dropdown / list, so initials are the correct fallback here.
  const renderNameLabel = (containerClass: string, textTone = "text-[#1A1A1A]") => {
    const raw = (name || alt || "Developer").trim();
    const SUFFIX = /\b(developments?|developers?|properties|property|realty|real\s*estate|holdings?|holding|group|llc|fz-?llc|pjsc|psc|inc|co|company|international|investments?)\b/gi;
    const cleaned = raw.replace(SUFFIX, "").replace(/\s{2,}/g, " ").trim() || raw;
    // Build initials: first char of each meaningful token, max 3.
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    let initials = tokens.map((t) => t[0]).join("").slice(0, 3).toUpperCase();
    // Single-token names (e.g. "EMAAR", "DAMAC") → use up to 4 leading chars.
    if (tokens.length === 1) {
      initials = tokens[0].slice(0, 4).toUpperCase();
    }
    if (!initials) initials = "—";
    const sizeClass =
      initials.length <= 2 ? "text-[15px]"
      : initials.length === 3 ? "text-[12px]"
      : "text-[10px]";
    return (
      <div
        className={cn(containerClass)}
        aria-label={raw}
        title={raw}
        data-developer-nameplate
      >
        <span
          className={cn(
            "font-bold tracking-tight leading-none text-center whitespace-nowrap",
            textTone,
            sizeClass,
          )}
        >
          {initials}
        </span>
      </div>
    );
  };

  // ── Nameplate variant — always renders the wordmark ──
  if (variant === "nameplate" || (variant === "bare" && override.forceNameplate)) {
    return renderNameLabel(cn(UNIFIED_PLATE, className));
  }

  if (variant === "bare") {
    if (!valid) {
      if (!renderFallback && !(name || alt)) return null;
      // Always keep the identical square container and place the dev name inside.
      if (name || alt) return renderNameLabel(cn(UNIFIED_PLATE, className));
      return renderNameLabel(cn(UNIFIED_PLATE, className));
    }
    return (
      <div className={cn(UNIFIED_PLATE, className)}>
        <img
          src={src as string}
          alt={alt}
          loading={loading}
          onError={() => {
            setError(true);
            onError?.();
          }}
          className="block max-w-full max-h-full w-auto h-auto object-contain"
          style={{
            filter: override.invert
              ? "invert(1) brightness(1)"
              : "contrast(1.08) saturate(1.1)",
          }}
        />
      </div>
    );
  }


  // ── Card variant — Reelly-style hero plate (developer directory) ──
  if (variant === "card") {
    const cardContainer = cn(
      "w-full h-full rounded-2xl inline-flex items-center justify-center bg-white border border-[#B89555]/30 p-6 overflow-hidden",
      className,
    );
    if (!valid) {
      if (name || alt) {
        // Use a slightly larger label inside the big card container.
        const raw = (name || alt || "Developer").trim();
        return (
          <div className={cardContainer} aria-label={raw} title={raw} data-developer-nameplate>
            <span className="font-bold tracking-tight leading-none text-center text-[#1A1A1A] text-2xl uppercase truncate">
              {raw}
            </span>
          </div>
        );
      }
      return renderNameLabel(cardContainer, "text-[#1A1A1A]");
    }
    return (
      <div className={cardContainer}>
        <img
          src={src as string}
          alt={alt}
          loading={loading}
          onError={() => {
            setError(true);
            onError?.();
          }}
          className="block max-h-full max-w-full w-auto h-auto object-contain"
          style={{ filter: "contrast(1.08) saturate(1.1)" }}
        />
      </div>
    );
  }

  // ── Default tile variant (developer directory, dev-detail, area chips) ──
  const tileContainer = cn(
    "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-[#FDFBF7] p-1.5 shadow-sm border border-[#B89555]/30 overflow-hidden",
    className,
  );
  if (!valid) {
    if (!renderFallback && !(name || alt)) return null;
    if (name || alt) return renderNameLabel(tileContainer);
    return renderNameLabel(tileContainer);
  }

  return (
    <div className={tileContainer}>
      <img
        src={src as string}
        alt={alt}
        loading={loading}
        onError={() => {
          setError(true);
          onError?.();
        }}
        className="block max-h-full max-w-full w-auto h-auto rounded-sm object-contain"
        style={{ filter: "contrast(1.08) saturate(1.1)" }}
      />
    </div>
  );
}
