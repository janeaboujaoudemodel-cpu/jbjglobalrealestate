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

// Unified emerald-bordered plate — identical between `bare` and `nameplate`
// so every project card has an identical badge footprint. Padding is
// kept minimal so wide wordmarks AND square marks both render at their
// maximum size without ever being cropped (object-contain enforced).
// Square-ish, ~35% smaller than the previous h-14 w-24 plate so cards feel
// closer to the Reelly reference. Padding stays minimal + object-contain
// is enforced on the <img loading="lazy" decoding="async" /> so wide wordmarks AND square marks render at
// their largest fitting size and are NEVER cropped.
const UNIFIED_PLATE =
  "h-12 w-12 sm:h-14 sm:w-14 aspect-square inline-flex items-center justify-center overflow-hidden " +
  "rounded-lg bg-[#FDFBF7] border border-[#B89555]/80 " +
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

  // Shared label renderer — when a logo is missing, keep the identical
  // champagne container but scale/wrap the actual developer wordmark so it
  // fits inside the plate without cropping in every dropdown/list.
  const renderNameLabel = (containerClass: string, textTone = "text-[#1A1A1A]", scale: "compact" | "card" = "compact") => {
    const raw = (name || alt || "Developer").trim();
    const SUFFIX = /\b(developments?|developers?|properties|property|realty|real\s*estate|holdings?|holding|group|llc|fz-?llc|pjsc|psc|inc|co|company|international|investments?)\b/gi;
    const cleaned = raw.replace(SUFFIX, "").replace(/\s{2,}/g, " ").trim() || raw;
    const displayName = cleaned.toUpperCase();
    const displayText = displayName
      .split(/\s+/)
      .map((part) => part.length > 8 ? part.replace(/(.{4})(?=.)/g, "$1\u200B") : part)
      .join(" ");
    const compactLength = displayName.replace(/\s+/g, "").length;
    const sizeClass = scale === "card"
      ? compactLength <= 6 ? "text-4xl"
        : compactLength <= 10 ? "text-3xl"
        : compactLength <= 16 ? "text-2xl"
        : compactLength <= 24 ? "text-xl"
        : "text-lg"
      : compactLength <= 4 ? "text-[11px]"
        : compactLength <= 6 ? "text-[9.5px]"
        : compactLength <= 9 ? "text-[7.5px]"
        : compactLength <= 14 ? "text-[6.25px]"
        : compactLength <= 20 ? "text-[5.5px]"
        : "text-[5px]";
    return (
      <div
        className={cn(containerClass, "[container-type:size]")}
        aria-label={raw}
        title={raw}
        data-developer-nameplate
      >
        <span
          className={cn(
            "block w-full max-w-full max-h-full overflow-hidden font-bold tracking-[-0.02em] leading-[0.86] text-center uppercase whitespace-normal break-words [overflow-wrap:anywhere] [word-break:break-word] [hyphens:auto] [text-wrap:balance]",
            textTone,
            sizeClass,
          )}
          data-developer-name
        >
          {displayText}
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
        // Always keep the identical square container and fit the dev name inside.
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
      "w-full h-full rounded-2xl inline-flex items-center justify-center bg-white border border-[#B89555]/70 p-6 overflow-hidden",
      className,
    );
    if (!valid) {
      if (name || alt) {
        return renderNameLabel(cardContainer, "text-[#1A1A1A]", "card");
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
    "w-14 h-14 rounded-md shrink-0 inline-flex items-center justify-center bg-[#FDFBF7] p-1.5 shadow-sm border border-[#B89555]/70 overflow-hidden",
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
